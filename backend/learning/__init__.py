"""
SAM AI - Self Learning System
Learns from user feedback and adapts responses.
"""

import os
import json
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, field
from database import SessionLocal
from models import User, Chat, UserPreferenceDB, UserKnowledgeDB
import sqlalchemy

@dataclass
class UserFeedback:
    user_id: str
    message_id: str
    rating: int  # 1-5
    feedback_text: str
    category: str  # quality, speed, accuracy, relevance
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

class FeedbackCollector:
    def __init__(self):
        pass
    
    def record_feedback(self, user_id: str, message_id: str, rating: int, feedback_text: str, category: str) -> UserFeedback:
        feedback = UserFeedback(
            user_id=user_id,
            message_id=message_id,
            rating=rating,
            feedback_text=feedback_text,
            category=category
        )
        self._persist_feedback(feedback)
        return feedback
    
    def _persist_feedback(self, feedback: UserFeedback):
        try:
            db = SessionLocal()
            try:
                from sqlalchemy import text
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS user_feedback (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(36) NOT NULL,
                        message_id VARCHAR(36) NOT NULL,
                        rating INT NOT NULL,
                        feedback_text TEXT,
                        category VARCHAR(50) NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                db.commit()
                
                db.execute(text("""
                    INSERT INTO user_feedback (user_id, message_id, rating, feedback_text, category)
                    VALUES (:user_id, :message_id, :rating, :feedback_text, :category)
                """), {
                    "user_id": feedback.user_id,
                    "message_id": feedback.message_id,
                    "rating": feedback.rating,
                    "feedback_text": feedback.feedback_text,
                    "category": feedback.category
                })
                db.commit()
            except Exception as e:
                print(f"Error persisting feedback: {e}")
            finally:
                db.close()
        except Exception as e:
            print(f"Database error: {e}")
    
    def get_user_feedback(self, user_id: str, limit: int = 50) -> List[UserFeedback]:
        try:
            db = SessionLocal()
            from sqlalchemy import text
            res = db.execute(text("SELECT * FROM user_feedback WHERE user_id = :uid ORDER BY timestamp DESC LIMIT :limit"), {"uid": user_id, "limit": limit}).fetchall()
            db.close()
            
            feedbacks = []
            for r in res:
                # SQLAlchemy result row handles indexing or attribute access
                feedbacks.append(UserFeedback(
                    user_id=r[1] if isinstance(r, tuple) else getattr(r, 'user_id', ''),
                    message_id=r[2] if isinstance(r, tuple) else getattr(r, 'message_id', ''),
                    rating=r[3] if isinstance(r, tuple) else getattr(r, 'rating', 0),
                    feedback_text=r[4] if isinstance(r, tuple) else getattr(r, 'feedback_text', ''),
                    category=r[5] if isinstance(r, tuple) else getattr(r, 'category', '')
                ))
            return feedbacks
        except Exception:
            return []
    
    def get_feedback_stats(self, user_id: str) -> Dict[str, Any]:
        user_feedback = self.get_user_feedback(user_id)
        if not user_feedback:
            return {"average_rating": 0, "total_feedback": 0, "categories": {}}
        
        ratings = [f.rating for f in user_feedback]
        avg_rating = sum(ratings) / len(ratings)
        
        categories: Dict[str, List[int]] = {}
        for f in user_feedback:
            if f.category not in categories:
                categories[f.category] = []
            categories[f.category].append(f.rating)
        
        return {
            "average_rating": round(avg_rating, 2),
            "total_feedback": len(user_feedback),
            "categories": {k: round(sum(v)/len(v), 2) for k, v in categories.items()}
        }

class PreferenceLearner:
    def __init__(self):
        pass
    
    def learn_preference(self, user_id: str, preference_type: str, preference_value: str):
        try:
            db = SessionLocal()
            existing = db.query(UserPreferenceDB).filter(UserPreferenceDB.user_id == user_id, UserPreferenceDB.preference_type == preference_type).first()
            if existing:
                existing.preference_value = preference_value
                existing.confidence = min(existing.confidence + 0.1, 1.0)
                existing.last_updated = datetime.utcnow()
            else:
                new_pref = UserPreferenceDB(
                    user_id=user_id,
                    preference_type=preference_type,
                    preference_value=preference_value
                )
                db.add(new_pref)
            db.commit()
            db.close()
        except Exception as e:
            print(f"Error saving preference: {e}")
    
    def get_preferences(self, user_id: str) -> Dict[str, str]:
        try:
            db = SessionLocal()
            prefs = db.query(UserPreferenceDB).filter(UserPreferenceDB.user_id == user_id).all()
            db.close()
            return {p.preference_type: p.preference_value for p in prefs if p.confidence > 0.5}
        except:
            return {}
    
    def get_prompt_modifiers(self, user_id: str) -> Dict[str, Any]:
        prefs = self.get_preferences(user_id)
        modifiers = {}
        
        if "response_length" in prefs:
            length = prefs["response_length"]
            if length == "short":
                modifiers["max_tokens"] = 200
            elif length == "medium":
                modifiers["max_tokens"] = 500
            elif length == "long":
                modifiers["max_tokens"] = 1000
        
        if "tone" in prefs:
            modifiers["tone"] = prefs["tone"]
        
        if "language" in prefs:
            modifiers["language"] = prefs["language"]
        
        return modifiers

class ResponseAnalyzer:
    def __init__(self):
        self.analysis_history: List[Dict[str, Any]] = []
    
    def analyze_response_quality(self, user_id: str, message: str, response: str, feedback: Optional[UserFeedback] = None) -> Dict[str, Any]:
        analysis = {
            "user_id": user_id,
            "message_length": len(message),
            "response_length": len(response),
            "response_time": datetime.utcnow().isoformat(),
            "quality_score": 0.0,
            "suggestions": []
        }
        
        if feedback:
            analysis["quality_score"] = feedback.rating / 5.0
            analysis["feedback_category"] = feedback.category
            analysis["feedback_text"] = feedback.feedback_text
        
        if len(response) > 2000:
            analysis["suggestions"].append("Response might be too long")
        if len(response) < 50:
            analysis["suggestions"].append("Response might be too short")
        
        self.analysis_history.append(analysis)
        return analysis

class KnowledgeUpdater:
    def __init__(self):
        pass
    
    def add_knowledge(self, user_id: str, source: str, content: str, metadata: Dict[str, Any] = None):
        try:
            db = SessionLocal()
            new_kb = UserKnowledgeDB(
                user_id=user_id,
                source=source,
                content=content,
                metadata_json=json.dumps(metadata or {})
            )
            db.add(new_kb)
            db.commit()
            db.close()
        except Exception as e:
            print(f"Error adding knowledge: {e}")
    
    def get_user_knowledge(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            db = SessionLocal()
            kb_list = db.query(UserKnowledgeDB).filter(UserKnowledgeDB.user_id == user_id).order_by(UserKnowledgeDB.usage_count.desc()).limit(limit).all()
            db.close()
            return [
                {
                    "source": kb.source,
                    "content": kb.content,
                    "metadata": json.loads(kb.metadata_json) if kb.metadata_json else {},
                    "timestamp": kb.timestamp.isoformat(),
                    "usage_count": kb.usage_count
                } for kb in kb_list
            ]
        except:
            return []
    
    def increment_usage(self, user_id: str, source: str):
        try:
            db = SessionLocal()
            kb = db.query(UserKnowledgeDB).filter(UserKnowledgeDB.user_id == user_id, UserKnowledgeDB.source == source).first()
            if kb:
                kb.usage_count += 1
                db.commit()
            db.close()
        except:
            pass

class SelfLearningSystem:
    def __init__(self):
        self.feedback_collector = FeedbackCollector()
        self.preference_learner = PreferenceLearner()
        self.response_analyzer = ResponseAnalyzer()
        self.knowledge_updater = KnowledgeUpdater()
    
    def record_feedback(self, user_id: str, message_id: str, rating: int, feedback_text: str, category: str):
        feedback = self.feedback_collector.record_feedback(user_id, message_id, rating, feedback_text, category)
        self._analyze_and_learn(user_id, feedback)
        return feedback
    
    def _analyze_and_learn(self, user_id: str, feedback: UserFeedback):
        if feedback.rating >= 4:
            self.preference_learner.learn_preference(user_id, "satisfaction", "high")
        elif feedback.rating <= 2:
            self.preference_learner.learn_preference(user_id, "satisfaction", "low")
        
        if "too long" in feedback.feedback_text.lower():
            self.preference_learner.learn_preference(user_id, "response_length", "short")
        elif "too short" in feedback.feedback_text.lower():
            self.preference_learner.learn_preference(user_id, "response_length", "long")
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        preferences = self.preference_learner.get_preferences(user_id)
        prompt_modifiers = self.preference_learner.get_prompt_modifiers(user_id)
        feedback_stats = self.feedback_collector.get_feedback_stats(user_id)
        
        return {
            "preferences": preferences,
            "prompt_modifiers": prompt_modifiers,
            "feedback_stats": feedback_stats
        }
    
    def add_user_knowledge(self, user_id: str, source: str, content: str, metadata: Dict[str, Any] = None):
        self.knowledge_updater.add_knowledge(user_id, source, content, metadata)
    
    def get_user_knowledge(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        return self.knowledge_updater.get_user_knowledge(user_id, limit)
    
    def analyze_response(self, user_id: str, message: str, response: str, feedback: Optional[UserFeedback] = None) -> Dict[str, Any]:
        return self.response_analyzer.analyze_response_quality(user_id, message, response, feedback)

# Global self-learning system instance
self_learning = SelfLearningSystem()
