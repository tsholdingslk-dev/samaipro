from .lankalore import LankaLoreTool
"""
SAM AI - Tools
Reusable tools that agents can use to complete tasks.
"""

import os
import json
import re
import math
from typing import Dict, Any, List, Optional
from datetime import datetime

class Tool:
    """Base tool class"""
    name: str = "base_tool"
    description: str = "Base tool"
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError

class SearchTool(Tool):
    name = "search"
    description = "Search the live web for real-time information and sources using Tavily AI & DuckDuckGo"
    
    def execute(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        import urllib.request
        import urllib.parse
        from html.parser import HTMLParser

        tavily_key = os.getenv("TAVILY_API_KEY")
        if tavily_key and tavily_key.startswith("tvly-"):
            try:
                tavily_url = "https://api.tavily.com/search"
                payload = json.dumps({
                    "api_key": tavily_key,
                    "query": query,
                    "search_depth": "basic",
                    "include_answer": True,
                    "max_results": max_results
                }).encode("utf-8")
                
                req = urllib.request.Request(
                    tavily_url,
                    data=payload,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    
                results = []
                for item in res_data.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "link": item.get("url", ""),
                        "snippet": item.get("content", "")
                    })

                return {
                    "tool": self.name,
                    "engine": "Tavily AI Search",
                    "query": query,
                    "answer": res_data.get("answer"),
                    "results": results,
                    "count": len(results),
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                print(f"Tavily search failed, checking Serper: {e}")

        # Try Serper Google Search API
        serper_key = os.getenv("SERPER_API_KEY")
        if serper_key and len(serper_key) > 10:
            try:
                serper_url = "https://google.serper.dev/search"
                payload = json.dumps({"q": query, "num": max_results}).encode("utf-8")
                req = urllib.request.Request(
                    serper_url,
                    data=payload,
                    headers={
                        "X-API-KEY": serper_key,
                        "Content-Type": "application/json"
                    }
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_data = json.loads(response.read().decode("utf-8"))

                results = []
                for item in res_data.get("organic", []):
                    results.append({
                        "title": item.get("title", ""),
                        "link": item.get("link", ""),
                        "snippet": item.get("snippet", "")
                    })

                return {
                    "tool": self.name,
                    "engine": "Serper Google Search",
                    "query": query,
                    "results": results,
                    "count": len(results),
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                print(f"Serper search failed, falling back to DuckDuckGo: {e}")

        # Fallback to DuckDuckGo HTML scraping
        class DDGHTMLParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.results = []
                self.in_result = False
                self.in_title = False
                self.in_snippet = False
                self.current_title = ""
                self.current_href = ""
                self.current_snippet = ""

            def handle_starttag(self, tag, attrs):
                attrs_dict = dict(attrs)
                if tag == "a" and "result__url" in attrs_dict.get("class", ""):
                    self.in_title = True
                    self.current_href = attrs_dict.get("href", "")
                elif tag == "a" and "result__snippet" in attrs_dict.get("class", ""):
                    self.in_snippet = True

            def handle_endtag(self, tag):
                if tag == "a" and self.in_title:
                    self.in_title = False
                elif tag == "a" and self.in_snippet:
                    self.in_snippet = False
                    if self.current_title or self.current_snippet:
                        self.results.append({
                            "title": self.current_title.strip(),
                            "link": urllib.parse.unquote(self.current_href.split("uddg=")[-1].split("&")[0]) if "uddg=" in self.current_href else self.current_href,
                            "snippet": self.current_snippet.strip()
                        })
                        self.current_title = ""
                        self.current_snippet = ""
                        self.current_href = ""

            def handle_data(self, data):
                if self.in_title:
                    self.current_title += data
                elif self.in_snippet:
                    self.current_snippet += data

        try:
            encoded_query = urllib.parse.quote_plus(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                html_content = response.read().decode("utf-8", errors="ignore")
                
            parser = DDGHTMLParser()
            parser.feed(html_content)
            results = parser.results[:max_results]
            
            if not results:
                titles = re.findall(r'<a class="result__url"[^>]*>(.*?)</a>', html_content)
                snippets = re.findall(r'<a class="result__snippet"[^>]*>(.*?)</a>', html_content)
                clean_r = []
                for idx in range(min(len(titles), max_results)):
                    clean_title = re.sub(r'<[^>]+>', '', titles[idx]).strip()
                    clean_snip = re.sub(r'<[^>]+>', '', snippets[idx]).strip() if idx < len(snippets) else ""
                    clean_r.append({"title": clean_title, "snippet": clean_snip})
                results = clean_r

            return {
                "tool": self.name,
                "engine": "DuckDuckGo",
                "query": query,
                "results": results,
                "count": len(results),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "tool": self.name,
                "query": query,
                "error": f"Search failed: {str(e)}",
                "results": [],
                "timestamp": datetime.utcnow().isoformat()
            }

class WebScraperTool(Tool):
    name = "web_scraper"
    description = "Scrape and extract text content from any public web URL"

    def execute(self, url: str) -> Dict[str, Any]:
        import urllib.request
        import urllib.parse
        
        try:
            if not url.startswith("http://") and not url.startswith("https://"):
                url = "https://" + url
                
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                html_code = response.read().decode("utf-8", errors="ignore")
                
            # Remove scripts, styles, metadata
            clean_text = re.sub(r'<(script|style|head|footer|nav)[^>]*>.*?</\1>', '', html_code, flags=re.DOTALL | re.IGNORECASE)
            # Remove HTML tags
            text_lines = re.sub(r'<[^>]+>', ' ', clean_text)
            # Clean whitespace
            text_content = ' '.join(text_lines.split())
            
            # Extract title if present
            title_match = re.search(r'<title>(.*?)</title>', html_code, re.IGNORECASE)
            title = title_match.group(1).strip() if title_match else url
            
            return {
                "tool": self.name,
                "url": url,
                "title": title,
                "content": text_content[:5000],  # Truncate for token efficiency
                "char_length": len(text_content)
            }
        except Exception as e:
            return {
                "tool": self.name,
                "url": url,
                "error": f"Failed to scrape URL: {str(e)}"
            }

class CodeExecutorTool(Tool):
    name = "code_executor"
    description = "Execute Python code in a safe cloud sandbox (E2B) or local sandbox and return output & errors"

    def execute(self, code: str, timeout_seconds: int = 10) -> Dict[str, Any]:
        import subprocess
        import sys
        import tempfile
        import urllib.request

        e2b_key = os.getenv("E2B_API_KEY")
        if e2b_key and e2b_key.startswith("e2b_"):
            try:
                # E2B Sandbox Execution via e2b Python package or REST HTTP endpoint
                try:
                    from e2b_code_interpreter import Sandbox
                    sb = Sandbox(api_key=e2b_key)
                    execution = sb.run_code(code)
                    sb.close()

                    logs_out = "\n".join([str(l) for l in execution.logs.stdout])
                    logs_err = "\n".join([str(l) for l in execution.logs.stderr])
                    error_msg = str(execution.error) if execution.error else ""

                    return {
                        "tool": self.name,
                        "engine": "E2B Cloud Sandbox",
                        "code": code,
                        "stdout": logs_out.strip(),
                        "stderr": logs_err.strip(),
                        "error": error_msg,
                        "results": [r.text for r in execution.results if hasattr(r, 'text')],
                        "success": not bool(execution.error)
                    }
                except ImportError:
                    pass  # Fallback to local subprocess if e2b package not installed
            except Exception as e:
                print(f"E2B Sandbox execution failed, falling back to local sandbox: {e}")

        # Local Python Sandbox Subprocess Execution
        forbidden = ["os.system", "shutil.rmtree", "subprocess.Popen", "format c:", "__import__('os').system"]
        for word in forbidden:
            if word in code:
                return {
                    "tool": self.name,
                    "engine": "Local Sandbox",
                    "error": f"Execution rejected: Forbidden operation '{word}' detected.",
                    "success": False
                }
                
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
                temp_file.write(code)
                temp_path = temp_file.name

            res = subprocess.run(
                [sys.executable, temp_path],
                capture_output=True,
                text=True,
                timeout=timeout_seconds
            )
            
            try:
                os.remove(temp_path)
            except Exception:
                pass

            return {
                "tool": self.name,
                "engine": "Local Python Sandbox",
                "code": code,
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "returncode": res.returncode,
                "success": res.returncode == 0
            }
        except subprocess.TimeoutExpired:
            return {
                "tool": self.name,
                "engine": "Local Python Sandbox",
                "code": code,
                "error": f"Execution timed out after {timeout_seconds} seconds.",
                "success": False
            }
        except Exception as e:
            return {
                "tool": self.name,
                "engine": "Local Python Sandbox",
                "code": code,
                "error": str(e),
                "success": False
            }

class ImageGeneratorTool(Tool):
    name = "image_generator"
    description = "Generate AI images from prompt descriptions using Flux / SDXL"

    def execute(self, prompt: str, width: int = 1024, height: int = 1024, model: str = "flux") -> Dict[str, Any]:
        import urllib.parse
        import random
        
        try:
            seed = random.randint(1000, 999999)
            clean_prompt = urllib.parse.quote(prompt)
            image_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width={width}&height={height}&nologo=true&seed={seed}&model={model}"
            
            return {
                "tool": self.name,
                "prompt": prompt,
                "image_url": image_url,
                "width": width,
                "height": height,
                "seed": seed,
                "provider": "Pollinations.ai (Flux/SDXL)"
            }
        except Exception as e:
            return {
                "tool": self.name,
                "prompt": prompt,
                "error": str(e)
            }

class FileTool(Tool):
    name = "file"
    description = "Read, write, and manage files"
    
    def execute(self, operation: str, path: str, content: str = None) -> Dict[str, Any]:
        if operation == "read":
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                return {"tool": self.name, "operation": operation, "path": path, "content": content}
            except Exception as e:
                return {"tool": self.name, "operation": operation, "path": path, "error": str(e)}
        elif operation == "write":
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content or "")
                return {"tool": self.name, "operation": operation, "path": path, "status": "success"}
            except Exception as e:
                return {"tool": self.name, "operation": operation, "path": path, "error": str(e)}
        return {"tool": self.name, "error": "Unknown operation"}

class CalculatorTool(Tool):
    name = "calculator"
    description = "Perform mathematical calculations"
    
    def execute(self, expression: str) -> Dict[str, Any]:
        try:
            allowed = set("0123456789+-*/(). ")
            if not all(c in allowed for c in expression):
                return {"tool": self.name, "error": "Invalid characters in expression"}
            result = eval(expression)
            return {"tool": self.name, "expression": expression, "result": result}
        except Exception as e:
            return {"tool": self.name, "expression": expression, "error": str(e)}

class TranslatorTool(Tool):
    name = "translator"
    description = "Translate text between languages"
    
    def execute(self, text: str, source_lang: str = "auto", target_lang: str = "en") -> Dict[str, Any]:
        return {
            "tool": self.name,
            "original": text,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "translated": f"[Translated to {target_lang}]: {text}",
            "note": "Use AI API for actual translation"
        }

class AnalyzerTool(Tool):
    name = "analyzer"
    description = "Analyze text, data, or code"
    
    def execute(self, content: str, analysis_type: str = "summary") -> Dict[str, Any]:
        if analysis_type == "summary":
            sentences = content.split('.')
            summary = '. '.join(sentences[:3]) + '.' if len(sentences) > 3 else content
            return {
                "tool": self.name,
                "type": analysis_type,
                "summary": summary,
                "word_count": len(content.split()),
                "sentence_count": len(sentences)
            }
        elif analysis_type == "sentiment":
            positive = ["good", "great", "excellent", "amazing", "wonderful"]
            negative = ["bad", "terrible", "awful", "horrible", "poor"]
            score = sum(1 for w in positive if w in content.lower()) - sum(1 for w in negative if w in content.lower())
            sentiment = "positive" if score > 0 else "negative" if score < 0 else "neutral"
            return {"tool": self.name, "type": analysis_type, "sentiment": sentiment, "score": score}
        return {"tool": self.name, "error": "Unknown analysis type"}

# Tool registry
TOOLS = {
    "search": SearchTool(),
    "web_scraper": WebScraperTool(),
    "code_executor": CodeExecutorTool(),
    "image_generator": ImageGeneratorTool(),
    "file": FileTool(),
    "calculator": CalculatorTool(),
    "translator": TranslatorTool(),
    "analyzer": AnalyzerTool(),
    "lankalore_search": LankaLoreTool()
}

def get_tool(tool_name: str) -> Optional[Tool]:
    return TOOLS.get(tool_name)

def list_tools() -> List[Dict[str, str]]:
    return [{"name": name, "description": tool.description} for name, tool in TOOLS.items()]
