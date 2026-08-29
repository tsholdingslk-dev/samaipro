"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Moon, Sun, Compass, ArrowLeft, Heart, 
  User, CheckCircle2, Grid, Download, Eye, Layers,
  Star, RefreshCw, Smartphone, Globe, Info, X, BookOpen,
  Calendar, Shield, Award, ChevronRight, Zap
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const RASIS = [
  { id: 0, name: "Mesha (Aries)", sinhala: "මේෂ", tamil: "மேஷம்", lord: "Mars", element: "Fire", icon: "♈ 🐏", traits: "Courageous, pioneering, ambitious, assertive, energetic." },
  { id: 1, name: "Vrishabha (Taurus)", sinhala: "වෘෂභ", tamil: "ரிஷபம்", lord: "Venus", element: "Earth", icon: "♉ 🐂", traits: "Stable, artistic, luxurious, patient, practical, resilient." },
  { id: 2, name: "Mithuna (Gemini)", sinhala: "මිථුන", tamil: "மிதுனம்", lord: "Mercury", element: "Air", icon: "♊ 👥", traits: "Intelligent, communicative, analytical, adaptable, curious." },
  { id: 3, name: "Karka (Cancer)", sinhala: "කටක", tamil: "கடகம்", lord: "Moon", element: "Water", icon: "♋ 🦀", traits: "Intuitive, nurturing, empathetic, memory retention, patriotic." },
  { id: 4, name: "Simha (Leo)", sinhala: "සිංහ", tamil: "சிம்மம்", lord: "Sun", element: "Fire", icon: "♌ 🦁", traits: "Regal, commanding, generous, visionary, creative leadership." },
  { id: 5, name: "Kanya (Virgo)", sinhala: "කන්‍යා", tamil: "கன்னி", lord: "Mercury", element: "Earth", icon: "♍ 🌾", traits: "Detail-oriented, methodical, analytical, problem-solver, health-conscious." },
  { id: 6, name: "Thula (Libra)", sinhala: "තුලා", tamil: "துலாம்", lord: "Venus", element: "Air", icon: "♎ ⚖️", traits: "Diplomatic, balanced, charming, justice-loving, aesthetic harmony." },
  { id: 7, name: "Vrischika (Scorpio)", sinhala: "වෘශ්චික", tamil: "விருச்சிகம்", lord: "Mars", element: "Water", icon: "♏ 🦂", traits: "Intense, transformative, secretive, investigative, magnetic willpower." },
  { id: 8, name: "Dhanu (Sagittarius)", sinhala: "ධනු", tamil: "தனுசு", lord: "Jupiter", element: "Fire", icon: "♐ 🏹", traits: "Philosophical, optimistic, truthful, adventurous, higher wisdom seeker." },
  { id: 9, name: "Makara (Capricorn)", sinhala: "මකර", tamil: "மகரம்", lord: "Saturn", element: "Earth", icon: "♑ 🐊", traits: "Disciplined, strategic, persevering, enterprise-builder, realistic." },
  { id: 10, name: "Kumbha (Aquarius)", sinhala: "කුම්භ", tamil: "கும்பம்", lord: "Saturn", element: "Air", icon: "♒ 🏺", traits: "Visionary, humanitarian, unorthodox, scientific innovator, egalitarian." },
  { id: 11, name: "Meena (Pisces)", sinhala: "මීන", tamil: "மீனம்", lord: "Jupiter", element: "Water", icon: "♓ 🐟", traits: "Spiritual, imaginative, compassionate, transcendent, meditative." },
];

const NAKSHATRAS = [
  { name: "Ashwini", sinhala: "අස්විද", tamil: "அஸ்வினி", lord: "Ketu", deity: "Ashwini Kumaras", symbol: "Horse's Head", gana: "Deva", dasha_years: 7 },
  { name: "Bharani", sinhala: "බෙරණ", tamil: "பரணி", lord: "Venus", deity: "Yama", symbol: "Yoni", gana: "Manushya", dasha_years: 20 },
  { name: "Krittika", sinhala: "කැති", tamil: "கார்த்திகை", lord: "Sun", deity: "Agni", symbol: "Razor / Flame", gana: "Rakshasa", dasha_years: 6 },
  { name: "Rohini", sinhala: "රෙහෙණ", tamil: "ரோகிணி", lord: "Moon", deity: "Brahma / Prajapati", symbol: "Chariot / Temple", gana: "Manushya", dasha_years: 10 },
  { name: "Mrigashira", sinhala: "මුවසිරස", tamil: "மிருகசீரிடம்", lord: "Mars", deity: "Soma", symbol: "Deer's Head", gana: "Deva", dasha_years: 7 },
  { name: "Ardra", sinhala: "අද", tamil: "திருவாதிரை", lord: "Rahu", deity: "Rudra", symbol: "Teardrop / Diamond", gana: "Manushya", dasha_years: 18 },
  { name: "Punarvasu", sinhala: "පුනාවස", tamil: "புனர்பூசம்", lord: "Jupiter", deity: "Aditi", symbol: "Bow and Quiver", gana: "Deva", dasha_years: 16 },
  { name: "Pushya", sinhala: "පුෂ", tamil: "பூசம்", lord: "Saturn", deity: "Brihaspati (Guru)", symbol: "Lotus / Cow's Udder", gana: "Deva", dasha_years: 19 },
  { name: "Ashlesha", sinhala: "අස්ලිස", tamil: "ஆயில்யம்", lord: "Mercury", deity: "Sarpas (Serpents)", symbol: "Coiled Snake", gana: "Rakshasa", dasha_years: 17 },
  { name: "Magha", sinhala: "මා", tamil: "மகம்", lord: "Ketu", deity: "Pitris (Ancestors)", symbol: "Royal Throne", gana: "Rakshasa", dasha_years: 7 },
  { name: "Purva Phalguni", sinhala: "පුවපල්", tamil: "பூரம்", lord: "Venus", deity: "Bhaga", symbol: "Front Legs of Couch", gana: "Manushya", dasha_years: 20 },
  { name: "Uttara Phalguni", sinhala: "උත්‍රපල්", tamil: "உத்திரம்", lord: "Sun", deity: "Aryaman", symbol: "Back Legs of Couch", gana: "Manushya", dasha_years: 6 },
  { name: "Hasta", sinhala: "හත", tamil: "அஸ்தம்", lord: "Moon", deity: "Savitar (Sun God)", symbol: "Open Hand / Fist", gana: "Deva", dasha_years: 10 },
  { name: "Chitra", sinhala: "සිත", tamil: "சித்திரை", lord: "Mars", deity: "Tvashtar (Divine Architect)", symbol: "Bright Jewel", gana: "Rakshasa", dasha_years: 7 },
  { name: "Svati", sinhala: "සා", tamil: "சுவாதி", lord: "Rahu", deity: "Vayu (Wind God)", symbol: "Young Shoot / Coral", gana: "Deva", dasha_years: 18 },
  { name: "Vishakha", sinhala: "විසා", tamil: "விசாகம்", lord: "Jupiter", deity: "Indra & Agni", symbol: "Triumphal Arch", gana: "Rakshasa", dasha_years: 16 },
  { name: "Anuradha", sinhala: "අනුර", tamil: "அனுஷம்", lord: "Saturn", deity: "Mitra", symbol: "Lotus Flower", gana: "Deva", dasha_years: 19 },
  { name: "Jyeshtha", sinhala: "දෙට", tamil: "கேட்டை", lord: "Mercury", deity: "Indra", symbol: "Circular Amulet / Umbrella", gana: "Rakshasa", dasha_years: 17 },
  { name: "Mula", sinhala: "මුල", tamil: "மூலம்", lord: "Ketu", deity: "Nirriti", symbol: "Tied Bunch of Roots", gana: "Rakshasa", dasha_years: 7 },
  { name: "Purva Ashadha", sinhala: "පුවසල", tamil: "பூராடம்", lord: "Venus", deity: "Apas (Water Goddess)", symbol: "Winnowing Basket / Fan", gana: "Manushya", dasha_years: 20 },
  { name: "Uttara Ashadha", sinhala: "උත්‍රසල", tamil: "உத்திராடம்", lord: "Sun", deity: "Vishwadevas", symbol: "Elephant Tusk", gana: "Manushya", dasha_years: 6 },
  { name: "Shravana", sinhala: "සුවණ", tamil: "திருவோணம்", lord: "Moon", deity: "Vishnu", symbol: "Ear / Three Footprints", gana: "Deva", dasha_years: 10 },
  { name: "Dhanishta", sinhala: "දෙනට", tamil: "அவிட்டம்", lord: "Mars", deity: "Eight Vasus", symbol: "Drum / Flute", gana: "Rakshasa", dasha_years: 7 },
  { name: "Shatabhisha", sinhala: "සියාවස", tamil: "சதயம்", lord: "Rahu", deity: "Varuna", symbol: "100 Physicians / Empty Circle", gana: "Rakshasa", dasha_years: 18 },
  { name: "Purva Bhadrapada", sinhala: "පුවපුටුප", tamil: "பூரட்டாதி", lord: "Jupiter", deity: "Aja Ekapada", symbol: "Front of Funeral Cot / Two-Faced Man", gana: "Manushya", dasha_years: 16 },
  { name: "Uttara Bhadrapada", sinhala: "උත්‍රපුටුප", tamil: "உத்திரட்டாதி", lord: "Saturn", deity: "Ahirbudhnya", symbol: "Back of Funeral Cot / Snake in Water", gana: "Manushya", dasha_years: 19 },
  { name: "Revati", sinhala: "රේවතී", tamil: "ரேவதி", lord: "Mercury", deity: "Pushan", symbol: "Fish / Pair of Fish", gana: "Deva", dasha_years: 17 },
];

const PLANET_SYMBOLS: { [key: string]: { sinhala: string; tamil: string; en: string; color: string; karaka: string; nature: string } } = {
  "Sun (Surya)": { sinhala: "ර", tamil: "சூ", en: "Su", color: "#f59e0b", karaka: "Soul, Father, Vitality, Authority, Government", nature: "Cruel Benefic / Sattvic Fire" },
  "Moon (Chandra)": { sinhala: "ච", tamil: "சந்", en: "Mo", color: "#10b981", karaka: "Mind, Mother, Emotions, Memory, Nourishment", nature: "Benefic / Sattvic Water" },
  "Mars (Chevvai)": { sinhala: "කු", tamil: "செ", en: "Ma", color: "#ef4444", karaka: "Courage, Real Estate, Siblings, Logic, Engineering", nature: "Malefic / Tamasic Fire" },
  "Mercury (Budha)": { sinhala: "-බු", tamil: "பு", en: "Me", color: "#3b82f6", karaka: "Intellect, Speech, Commerce, Software, Mathematics", nature: "Adaptive Benefic / Rajasic Earth" },
  "Jupiter (Guru)": { sinhala: "ගු", tamil: "குரு", en: "Ju", color: "#eab308", karaka: "Wisdom, Wealth, Children, Dharma, Spirituality", nature: "Supreme Benefic / Sattvic Ether" },
  "Venus (Sukra)": { sinhala: "-සි", tamil: "சு", en: "Ve", color: "#ec4899", karaka: "Love, Arts, Vehicles, Luxury, Marriage, Aesthetics", nature: "Prime Benefic / Rajasic Water" },
  "Saturn (Sani)": { sinhala: "-ශ", tamil: "சனி", en: "Sa", color: "#8b5cf6", karaka: "Longevity, Discipline, Perseverance, Hard Work, Karma", nature: "Great Malefic / Tamasic Air" },
  "Rahu ℞": { sinhala: "-රා", tamil: "ரா", en: "Ra", color: "#06b6d4", karaka: "Ambition, Innovation, Foreign Lands, Artificial Intelligence", nature: "Shadow Planet (Chhaya Graha)" },
  "Ketu ℞": { sinhala: "-කේ", tamil: "கே", en: "Ke", color: "#f97316", karaka: "Moksha, Intuition, Occult, Detachment, Deep Analytics", nature: "Spiritual Node (Moksha Karaka)" },
  "Ascendant (Lagna)": { sinhala: "ල", tamil: "ல", en: "Asc", color: "#c084fc", karaka: "Self, Physical Constitution, General Destiny, Vitality", nature: "Core Reference Point (Tanu Bhava)" },
};

const DASHA_SEQ = [
  { lord: "Ketu", years: 7, mantra: "Om Kem Ketave Namaha" },
  { lord: "Venus", years: 20, mantra: "Om Shum Shukraya Namaha" },
  { lord: "Sun", years: 6, mantra: "Om Hram Hrim Hroum Sah Suryaya Namaha" },
  { lord: "Moon", years: 10, mantra: "Om Shram Shrim Shroum Sah Chandraya Namaha" },
  { lord: "Mars", years: 7, mantra: "Om Kram Krim Kroum Sah Bhaumaya Namaha" },
  { lord: "Rahu", years: 18, mantra: "Om Bhram Bhrim Bhroum Sah Rahave Namaha" },
  { lord: "Jupiter", years: 16, mantra: "Om Gram Grim Groum Sah Gurave Namaha" },
  { lord: "Saturn", years: 19, mantra: "Om Pram Prim Proum Sah Shanaischaraya Namaha" },
  { lord: "Mercury", years: 17, mantra: "Om Bram Brim Broum Sah Budhaya Namaha" }
];

const PLANET_DATA: { [key: string]: any } = {
  "Sun (Surya)": {
    baseOverview: "Surya (Sun) is the Atma Karaka (Soul Signifier), representing pure consciousness, personal sovereignty, leadership, government honor, and fatherly vitality.",
    houses: {
      1: { title: "Digbala in Tanu Bhava (1st House)", effect: "Commanding charisma, innate authority, strong skeletal vitality, natural executive presence, and independent spirit.", drishti: "Casts full 7th aspect onto the 7th house of partnerships, demanding respect and dignity in alliances." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Authoritative voice, noble family lineage, focus on state/government revenues, and high fiscal discipline.", drishti: "Aspects the 8th house of secret knowledge and transformation, granting acute analytical depth." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Fearless warrior drive, decisive communication, high initiative in commercial ventures, and leadership among peers.", drishti: "Aspects the 9th house of Dharma, infusing deep conviction into ethical principles and beliefs." },
      4: { title: "Sukha Bhava (4th House)", effect: "Royal domestic foundation, ancestral property protection, strong patriotic inclinations, and enduring mental willpower.", drishti: "Aspects the 10th house of career (Karma Bhava), ensuring career prominence and public respect." },
      5: { title: "Poorva Punya (5th House)", effect: "Brilliant strategic intelligence, creative mastery, high political acumen, blessing of noble progeny, and mastery of mantras.", drishti: "Aspects the 11th house of Labha (gains), converting intellectual inventions into massive revenues." },
      6: { title: "Shatru Hanta (6th House)", effect: "Complete victory over competitors and adversaries, robust immunological stamina, success in administrative litigation.", drishti: "Aspects the 12th house of foreign affairs, ensuring authority in overseas and institutional dealings." },
      7: { title: "Kalathra Bhava (7th House)", effect: "High-status partnerships, influential public relations, and a dignified, principle-driven partner.", drishti: "Aspects the 1st house (Lagna), reinforcing personal sovereignty and social stature." },
      8: { title: "Randhra Bhava (8th House)", effect: "Profound investigative insight, interest in occult sciences and government analytics, longevity through disciplined life.", drishti: "Aspects the 2nd house of accumulated wealth and lineage, giving control over long-term assets." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Supreme divine grace, philosophical leadership, fortune through ethical enterprises, and global academic acclaim.", drishti: "Aspects the 3rd house of courage, turning theoretical wisdom into decisive commercial actions." },
      10: { title: "Digbala Raja Yoga (10th House)", effect: "Peak career authority, government honors, executive power, institutional builder, and renowned reputation.", drishti: "Aspects the 4th house of happiness, bringing satisfaction through professional triumphs." },
      11: { title: "Labha Bhava (11th House)", effect: "Extraordinary wealth accumulation, elite social networks, influential mentors, and total fulfillment of grand ambitions.", drishti: "Aspects the 5th house of intellect, multiplying speculative and creative breakthroughs." },
      12: { title: "Moksha Bhava (12th House)", effect: "Success in foreign governments, international diplomacy, spiritual enlightenment, and deep inner detachment.", drishti: "Aspects the 6th house, overcoming hidden obstacles and competitors through strategic wisdom." }
    },
    remedy: "Chant the Aditya Hridaya Stotram on Sundays at sunrise, offer water in a copper vessel (Surya Arghya), and wear high-grade Ruby (Manikkam) under expert guidance."
  },
  "Moon (Chandra)": {
    baseOverview: "Chandra (Moon) is the Manas Karaka (Mind & Emotion Signifier), ruling psychological equilibrium, intuition, maternal connection, and liquid wealth.",
    houses: {
      1: { title: "Lagna Moon (1st House)", effect: "Magnetic personal charm, deep emotional empathy, intuitive perceptiveness, luminous complexion, and widespread public affection.", drishti: "Aspects the 7th house, attracting caring and emotionally responsive partners." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Sweet persuasive speech, fluctuating yet abundant cash flow, high investment in family comforts, and artistic appreciation.", drishti: "Aspects the 8th house, granting strong psychic intuition and emotional recovery power." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Creative writing genius, persuasive artistic communication, close bonds with siblings, and frequent inspiring journeys.", drishti: "Aspects the 9th house, aligning emotional impulses with righteous spiritual curiosity." },
      4: { title: "Digbala Sukha Bhava (4th House)", effect: "Full directional strength (Digbala), profound inner peace, luxurious home sanctuary, maternal blessings, and vehicle comforts.", drishti: "Aspects the 10th house of career, blessing with a nurturing and public-facing professional career." },
      5: { title: "Poorva Punya (5th House)", effect: "Refined creative imagination, artistic storytelling, loving children, sharp psychological understanding, and intuitive investing.", drishti: "Aspects the 11th house, generating steady wealth streams through creative ventures." },
      6: { title: "Shatru Bhava (6th House)", effect: "Dedication to health healing, service in care-taking or hospitality sectors, sharp discernment in workplace dynamics.", drishti: "Aspects the 12th house, facilitating restful meditation and release of mental anxiety." },
      7: { title: "Kalathra Bhava (7th House)", effect: "Charming, empathetic, and aesthetically refined spouse; highly successful in public relations, commerce, and consumer trade.", drishti: "Aspects the 1st house, infusing your aura with warmth and approachable gentleness." },
      8: { title: "Randhra Bhava (8th House)", effect: "Deep psychological and occult research, mystical dreams, high psychic sensitivity, and transformative emotional rebirths.", drishti: "Aspects the 2nd house, managing family legacies and liquid financial instruments." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Auspicious pilgrimage travels, fortunate mentors, noble spiritual inclinations, and flourishing global worldview.", drishti: "Aspects the 3rd house, expressing philosophical truths through poetic and inspiring words." },
      10: { title: "Karma Bhava (10th House)", effect: "Dynamic public career, popularity with masses, success in travel/food/hospitality/creative industries, and honorable status.", drishti: "Aspects the 4th house, harmonizing professional triumphs with emotional family happiness." },
      11: { title: "Labha Bhava (11th House)", effect: "Consistent financial growth, wide circle of supportive friends and influential women patrons, achieving heartfelt goals.", drishti: "Aspects the 5th house, fostering fertile creative ideas and joy from children." },
      12: { title: "Moksha Bhava (12th House)", effect: "Profound spiritual meditation, peaceful sleep, success in foreign lands and coastal regions, intuitive dream downloads.", drishti: "Aspects the 6th house, healing bodily stress through mindfulness and solitude." }
    },
    remedy: "Chant 'Om Namah Shivaya' on Mondays, drink water stored in pure silver vessels, and respect mother figures."
  },
  "Mars (Chevvai)": {
    baseOverview: "Mangala (Mars) is the Bhratru & Bhoomi Karaka, commanding courage, adrenaline, physical vitality, logic, real estate, and engineering mastery.",
    houses: {
      1: { title: "Ruchaka / Lagna Mars (1st House)", effect: "Unyielding courage, sharp athletic reflexes, assertive executive energy, pioneering spirit, and magnetic willpower.", drishti: "Special 4th, 7th, and 8th aspects ignite high drive in property, partnerships, and crisis management." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Bold and direct speech, assertive financial management, wealth creation through engineering or real estate.", drishti: "Special aspects onto the 5th, 8th, and 9th houses empower tactical investments and decisive action." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Unrivaled bravery, martial competitiveness, digital/technical innovation, and mastery over technical crafts.", drishti: "Special aspects onto the 6th, 9th, and 10th houses ensure victory over competitors and rapid career ascents." },
      4: { title: "Sukha Bhava (4th House)", effect: "Passionate protection of home, strong drive in land acquisition and automotive technology, domestic leadership.", drishti: "Special aspects onto the 7th, 10th, and 11th houses channel domestic drive into massive commercial achievements." },
      5: { title: "Poorva Punya (5th House)", effect: "Brilliant technical intelligence, sharp strategic gaming/coding mindset, decisive leadership in creative enterprises.", drishti: "Special aspects onto the 8th, 11th, and 12th houses yield sudden breakthroughs in speculative analytics." },
      6: { title: "Shatru Hanta Yoga (6th House)", effect: "Extraordinary competitive dominance, demolishes obstacles and legal adversaries, athletic stamina, and surgical problem-solving.", drishti: "Special aspects onto the 9th, 12th, and 1st houses shield your personal vitality from hidden hazards." },
      7: { title: "Kalathra Bhava (7th House)", effect: "Dynamic, ambitious, and strong-willed partner; high energy in commercial ventures and contract negotiations.", drishti: "Special aspects onto the 10th, 1st, and 2nd houses fuel relentless drive for collective prosperity." },
      8: { title: "Randhra Bhava (8th House)", effect: "Deep technical forensics, cyber-security, emergency crisis leadership, occult mechanics, and transformative stamina.", drishti: "Special aspects onto the 11th, 2nd, and 3rd houses generate sudden financial recoveries from hidden sources." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Passionate defender of righteousness, high energy in international adventures, inspiring mentorship, and ideological drive.", drishti: "Special aspects onto the 12th, 3rd, and 4th houses inspire global expansions and property developments." },
      10: { title: "Kuladipaka / Digbala (10th House)", effect: "Supreme directional strength (Digbala), peak executive command, architectural prowess, industrial leadership, and renown.", drishti: "Special aspects onto the 1st, 4th, and 5th houses infuse the entire chart with unstoppable energy." },
      11: { title: "Labha Bhava (11th House)", effect: "Massive financial acquisitions, leadership in tech/industrial networks, conquering long-term material ambitions.", drishti: "Special aspects onto the 2nd, 5th, and 6th houses ensure consistent fiscal superiority." },
      12: { title: "Moksha Bhava (12th House)", effect: "High drive in foreign missions, international tech implementations, intense disciplined meditation, and secret strategies.", drishti: "Special aspects onto the 3rd, 6th, and 7th houses neutralize foreign competitors." }
    },
    remedy: "Chant the Hanuman Chalisa on Tuesdays, recite 'Om Kram Krim Kroum Sah Bhaumaya Namaha', and donate blood or support veterans."
  },
  "Mercury (Budha)": {
    baseOverview: "Budha (Mercury) is the Vidya & Buddhi Karaka, governing analytical intelligence, commercial agility, speech, software algorithms, and communication.",
    houses: {
      1: { title: "Bhadra / Lagna Mercury (1st House)", effect: "Sharp intellectual wit, youthfulness, linguistic mastery, mathematical brilliance, and exceptional communicative charm.", drishti: "Aspects the 7th house, facilitating witty and intellectually stimulating partnerships." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Eloquent persuasive speech, accounting and commercial genius, wealth creation through commerce, publishing, or code.", drishti: "Aspects the 8th house, unearthing deep financial insights and mathematical patterns." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Prolific author, media powerhouse, software engineering expertise, multi-tasking mastery, and vibrant sibling ties.", drishti: "Aspects the 9th house, linking day-to-day communication with higher scientific knowledge." },
      4: { title: "Sukha Bhava (4th House)", effect: "Scholarly home environment, extensive library, high academic credentials, and analytical domestic peace.", drishti: "Aspects the 10th house, securing professional success in IT, research, education, or consulting." },
      5: { title: "Poorva Punya (5th House)", effect: "Genius-level problem solver, algorithmic mastery, high investment intelligence, creative writing, and gifted children.", drishti: "Aspects the 11th house, turning innovative software or trade concepts into massive revenue streams." },
      6: { title: "Shatru Bhava (6th House)", effect: "Excellence in legal debate, data analytics, resolving complex disputes, and optimizing operational workflows.", drishti: "Aspects the 12th house, streamlining international supply chains and foreign accounts." },
      7: { title: "Kalathra Bhava (7th House)", effect: "Intelligent, articulate, and business-savvy partner; excellence in commercial contracts and international trade.", drishti: "Aspects the 1st house, sharpening your analytical acumen and communicative aura." },
      8: { title: "Randhra Bhava (8th House)", effect: "Data forensics, cryptography, secret research breakthroughs, profound analytical acumen, and inheritance management.", drishti: "Aspects the 2nd house of wealth, generating profits through hidden intellectual property." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Higher intellectual publishing, international scientific lectures, fortunate mentorship, and philosophical logic.", drishti: "Aspects the 3rd house, translating complex global theories into practical accessible media." },
      10: { title: "Digbala / Karma (10th House)", effect: "Supreme career in technology, media, governance, finance, or commerce; celebrated intellectual executive.", drishti: "Aspects the 4th house, establishing educational institutions and respected family legacy." },
      11: { title: "Labha Bhava (11th House)", effect: "Huge revenues through multiple commercial channels, tech syndicates, intellectual networking, and achieving financial goals.", drishti: "Aspects the 5th house, continuously regenerating creative and speculative intelligence." },
      12: { title: "Moksha Bhava (12th House)", effect: "Success in foreign software markets, global academic research, meditative writing, and international consulting.", drishti: "Aspects the 6th house, solving intricate technical snags and overcoming competitors with wit." }
    },
    remedy: "Chant 'Om Bram Brim Broum Sah Budhaya Namaha' on Wednesdays, wear Emerald (Maragatham), and sponsor educational books for students."
  },
  "Jupiter (Guru)": {
    baseOverview: "Brihaspati (Jupiter) is the Supreme Benefic and Guru Karaka, ruling divine wisdom, financial expansion, dharma, noble children, and spiritual grace.",
    houses: {
      1: { title: "Hamsa / Digbala (1st House)", effect: "Magnificent aura, noble character, deep spiritual wisdom, philosophical optimism, and lifelong divine protection.", drishti: "Special 5th, 7th, and 9th aspects shower divine blessings on intellect, marriage, and supreme fortune." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Extraordinary wealth multiplication, truthful and inspirational speech, prestigious family lineage, and generous philanthropy.", drishti: "Special aspects onto the 6th, 8th, and 10th houses bring effortless dispute resolution and high career honors." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Philosophical writing, ethical journalism, uplifting community leadership, and harmonious fraternal relations.", drishti: "Special aspects onto the 7th, 9th, and 11th houses attract righteous partners and expansive network gains." },
      4: { title: "Hamsa Raja Yoga (4th House)", effect: "Palatial residence, profound inner contentment, exceptional higher education, divine maternal blessings, and ancestral land.", drishti: "Special aspects onto the 8th, 10th, and 12th houses bring spiritual peace and celebrated professional standing." },
      5: { title: "Poorva Punya Trikona (5th House)", effect: "Supreme intellect, blessings of virtuous children, mastery of sacred sciences, and lucrative advisory appointments.", drishti: "Special aspects onto the 9th, 11th, and 1st houses align your soul with immense wealth and cosmic grace." },
      6: { title: "Shatru Bhava (6th House)", effect: "Overcomes all health ailments through holistic lifestyle, eliminates financial debt through prudent planning, wise counselor.", drishti: "Special aspects onto the 10th, 12th, and 2nd houses protect professional standing and family assets." },
      7: { title: "Kalathra Bhava (7th House)", effect: "Virtuous, learned, and wealthy partner; immense prosperity through joint ventures and public advisory roles.", drishti: "Special aspects onto the 11th, 1st, and 3rd houses expand your social wealth, vitality, and courage." },
      8: { title: "Randhra Bhava (8th House)", effect: "Mastery of occult sciences, long and healthy lifespan, peaceful spiritual transformations, and unexpected inheritance blessings.", drishti: "Special aspects onto the 12th, 2nd, and 4th houses ensure spiritual liberation and family treasury security." },
      9: { title: "Bhagya Trikona (9th House)", effect: "Supreme fortune, global spiritual authority, high mentorship, divine pilgrimage, and generational prosperity.", drishti: "Special aspects onto the 1st, 3rd, and 5th houses infuse your entire existence with cosmic luck." },
      10: { title: "Karma Bhava (10th House)", effect: "High judicial, executive, or institutional leadership; renowned counselor, respected teacher, and ethical industrialist.", drishti: "Special aspects onto the 2nd, 4th, and 6th houses safeguard family wealth, happiness, and work victory." },
      11: { title: "Labha Bhava (11th House)", effect: "Limitless wealth creation, influential mentors, elite community leadership, and effortless fulfillment of desires.", drishti: "Special aspects onto the 3rd, 5th, and 7th houses multiply creative intellect and joyful partnerships." },
      12: { title: "Moksha Bhava (12th House)", effect: "Spiritual liberation, generous charity, deep meditative states, peaceful retreats, and success in foreign ashrams/universities.", drishti: "Special aspects onto the 4th, 6th, and 8th houses bring tranquil home sanctuary and protection." }
    },
    remedy: "Chant 'Om Gram Grim Groum Sah Gurave Namaha' on Thursdays, wear Yellow Sapphire (Pushparagam), and offer yellow flowers/bananas to teachers."
  },
  "Venus (Sukra)": {
    baseOverview: "Shukra (Venus) is the Kalathra & Beauty Karaka, governing love, artistic refinement, luxury vehicles, marital bliss, and aesthetic elegance.",
    houses: {
      1: { title: "Malavya / Lagna Venus (1st House)", effect: "Stunning physical charm, charismatic magnetism, refined taste in fashion/arts, and romantic popularity.", drishti: "Aspects the 7th house, assuring deep devotion, beauty, and harmony in marital union." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Sweet melodious voice, exquisite jewelry and precious gem collection, wealth from luxury commodities and arts.", drishti: "Aspects the 8th house, attracting unexpected financial benefits from marriage and partnerships." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Creative performing arts, interior design genius, pleasant communications, and affectionate ties with siblings.", drishti: "Aspects the 9th house, inspiring fortunate travels for cultural and artistic expositions." },
      4: { title: "Malavya Raja Yoga (4th House)", effect: "Palatial home with luxury aesthetics, collection of premium vehicles, profound maternal bonding, and domestic joy.", drishti: "Aspects the 10th house, blessing with an illustrious career in cinema, luxury, design, or diplomacy." },
      5: { title: "Poorva Punya (5th House)", effect: "Exceptional artistic creativity, poetic eloquence, romantic fulfillment, talented children, and speculative artistic windfalls.", drishti: "Aspects the 11th house, turning creative concepts into grand monetary fortunes." },
      6: { title: "Shatru Bhava (6th House)", effect: "Tactful diplomacy in resolving disputes, success in hospitality, cosmetic wellness, and beauty medicine.", drishti: "Aspects the 12th house, promoting blissful relaxation and luxury foreign stays." },
      7: { title: "Malavya / Kalathra (7th House)", effect: "Exceptionally attractive, loving, and supportive partner; high prosperity through luxury trade and global hospitality.", drishti: "Aspects the 1st house, reflecting youthful beauty and elegance onto your persona." },
      8: { title: "Randhra Bhava (8th House)", effect: "Secret artistic investments, inheritance of luxury goods and assets, sensual rejuvenation, and peaceful longevity.", drishti: "Aspects the 2nd house, enriching the family treasury with antique and precious valuables." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Fortunate foreign cultural tours, romantic serendipities, blessings of refined mentors, and artistic spirituality.", drishti: "Aspects the 3rd house, expressing cultural wisdom through refined literature and music." },
      10: { title: "Karma Bhava (10th House)", effect: "Celebrated career in fashion, luxury hospitality, cinema, arts, diplomatic relations, or financial services.", drishti: "Aspects the 4th house, ensuring domestic peace and luxurious residential environments." },
      11: { title: "Labha Bhava (11th House)", effect: "Continuous cash flow from luxury goods, high-society friends, artistic syndicates, and material prosperity.", drishti: "Aspects the 5th house, amplifying romantic joy and creative output." },
      12: { title: "Exalted Moksha (12th House)", effect: "Classical placement for bed pleasures, luxury foreign travel, peaceful sleep, and generous philanthropic donations.", drishti: "Aspects the 6th house, overcoming stress through cultural relaxation and meditation." }
    },
    remedy: "Recite Sri Suktam or 'Om Shum Shukraya Namaha' on Fridays, wear Diamond or White Zircon, and respect artists and women."
  },
  "Saturn (Sani)": {
    baseOverview: "Shani (Saturn) is the Karma & Ayur Karaka, presiding over longevity, justice, perseverance, strategic structure, realism, and permanent enterprise.",
    houses: {
      1: { title: "Sasa Raja Yoga / Lagna Sani (1st House)", effect: "Profound maturity, exceptional patience, serious contemplative mind, resilient constitution, and enduring leadership.", drishti: "Special 3rd, 7th, and 10th aspects instill iron discipline into courage, alliances, and career legacy." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Prudent financial realism, long-term wealth accumulation, cautious speech, and conservative asset management.", drishti: "Special aspects onto the 4th, 8th, and 11th houses bring solid real estate security and delayed yet massive returns." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Extraordinary tenacity, systematic work ethic, technical writing prowess, and victory over all initial hardships.", drishti: "Special aspects onto the 5th, 9th, and 12th houses anchor spiritual wisdom and analytical endurance." },
      4: { title: "Sasa Raja Yoga (4th House)", effect: "Massive foundation in ancestral land and heavy industries, deep emotional stoicism, and long-term property legacy.", drishti: "Special aspects onto the 6th, 10th, and 1st houses solidify unassailable professional authority." },
      5: { title: "Poorva Punya (5th House)", effect: "Methodical intellectual research, high discipline in analytical studies, realistic investments, and wise parental guidance.", drishti: "Special aspects onto the 7th, 11th, and 2nd houses build permanent wealth from dedicated research." },
      6: { title: "Shatru Hanta Yoga (6th House)", effect: "Invincible resistance against illness, completely wears down all adversaries and competitors, master of organizational logistics.", drishti: "Special aspects onto the 8th, 12th, and 3rd houses grant long life and tireless work stamina." },
      7: { title: "Digbala / Sasa Yoga (7th House)", effect: "Supreme directional strength (Digbala), mature, loyal, and steadfast partner; permanent growth in international commerce.", drishti: "Special aspects onto the 9th, 1st, and 4th houses anchor personal integrity and public esteem." },
      8: { title: "Ayur Sthana (8th House)", effect: "Long and resilient lifespan (Deergha Ayu), deep research into history/mining/cryptography, and profound karmic wisdom.", drishti: "Special aspects onto the 10th, 2nd, and 5th houses protect long-term career foundations." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Dedication to traditional philosophies, disciplined pilgrimage, enduring ethical principles, and respect for elder mentors.", drishti: "Special aspects onto the 11th, 3rd, and 6th houses convert moral diligence into tangible financial gains." },
      10: { title: "Karma / Sasa Yoga (10th House)", effect: "Pinnacle of executive endurance, industrial magnate, political statesman, legendary work ethic, and enduring legacy.", drishti: "Special aspects onto the 12th, 4th, and 7th houses safeguard institutional stability." },
      11: { title: "Labha Bhava (11th House)", effect: "Massive long-term wealth accumulation, powerful enterprise networks, steady compounding revenues, and goal attainment.", drishti: "Special aspects onto the 1st, 5th, and 8th houses bring lifelong security and enduring peace." },
      12: { title: "Moksha Bhava (12th House)", effect: "Spiritual discipline, solitary research success, international institutional management, and deep detachment from material ego.", drishti: "Special aspects onto the 2nd, 6th, and 9th houses protect against impulsive losses." }
    },
    remedy: "Chant the Hanuman Chalisa or 'Om Sham Shanaischaraya Namaha' on Saturdays, light sesame oil lamps, and support manual laborers."
  },
  "Rahu ℞": {
    baseOverview: "Rahu is the Shadow Node (Chhaya Graha) of ambition, digital innovation, international frontiers, high technology, and unconventional breakthroughs.",
    houses: {
      1: { title: "Lagna Rahu (1st House)", effect: "Hypnotic charisma, unorthodox worldview, pioneering in AI and frontier technologies, bold independent persona.", drishti: "Aspects 5th, 7th, and 9th houses, generating sudden speculative and global breakthroughs." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Unconventional wealth sources, crypto/fintech profits, multi-lingual fluency, and sharp financial perception.", drishti: "Aspects the 6th, 8th, and 10th houses, conquering commercial markets through digital intelligence." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Tremendous courage in media/tech, revolutionary digital projects, massive social reach, and daring initiative.", drishti: "Aspects the 7th, 9th, and 11th houses, expanding global networks and international alliances." },
      4: { title: "Sukha Bhava (4th House)", effect: "Modern high-tech smart residences, foreign relocations, passion for imported vehicles, and dynamic mind.", drishti: "Aspects the 8th, 10th, and 12th houses, linking home life with international career prospects." },
      5: { title: "Poorva Punya (5th House)", effect: "Algorithmic genius, frontier AI/crypto research, unconventional artistic creations, and high speculative acumen.", drishti: "Aspects the 9th, 11th, and 1st houses, producing sudden exponential windfalls." },
      6: { title: "Shatru Hanta (6th House)", effect: "Legendary powerhouse in overcoming all rivals, immunity against cyber/legal attacks, triumphs in complex corporate environments.", drishti: "Aspects the 10th, 12th, and 2nd houses, securing overseas corporate dominance." },
      7: { title: "Kalathra Bhava (7th House)", effect: "Foreign or culturally diverse partner; huge success in multinational corporations and international export/import trade.", drishti: "Aspects the 11th, 1st, and 3rd houses, boosting personal reach across global markets." },
      8: { title: "Randhra Bhava (8th House)", effect: "Deep cybersecurity investigations, secret technologies, occult discoveries, and sudden massive inheritance or buyout windfalls.", drishti: "Aspects the 12th, 2nd, and 4th houses, opening clandestine wealth streams." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Unorthodox philosophical systems, international education, breaking conventional dogmas, and global cultural journeys.", drishti: "Aspects the 1st, 3rd, and 5th houses, enriching the mind with cutting-edge concepts." },
      10: { title: "Karma Bhava (10th House)", effect: "Explosive career rise in technology, media, politics, AI platforms, or multinational conglomerates; celebrity influence.", drishti: "Aspects the 2nd, 4th, and 6th houses, multiplying global organizational authority." },
      11: { title: "Labha Bhava (11th House)", effect: "Massive wealth windfalls through high-tech and overseas syndicates, achieving audacious dreams, elite global circle.", drishti: "Aspects the 3rd, 5th, and 7th houses, ensuring relentless financial multiplication." },
      12: { title: "Moksha Bhava (12th House)", effect: "Permanent foreign settlement, global digital exports, transcendental meditation, and deep subconscious insights.", drishti: "Aspects the 4th, 6th, and 8th houses, providing peace and prosperity abroad." }
    },
    remedy: "Chant 'Om Bhram Bhrim Bhroum Sah Rahave Namaha', recite Durga Chalisa, and feed birds or stray animals on Saturdays."
  },
  "Ketu ℞": {
    baseOverview: "Ketu is the Moksha Karaka (Spiritual Node), governing mystical intuition, computational mathematics, detachment, and high-dimensional insight.",
    houses: {
      1: { title: "Lagna Ketu (1st House)", effect: "Mystical presence, sharp sixth sense, intuitive problem-solving, spiritual independence, and profound depth.", drishti: "Aspects 5th, 7th, and 9th houses, infusing relationships and intellect with spiritual detachment." },
      2: { title: "Dhana Bhava (2nd House)", effect: "Philosophical speech, detachment from material greed while maintaining steady reserves, insight into occult finances.", drishti: "Aspects the 6th, 8th, and 10th houses, analyzing financial risk with deep precision." },
      3: { title: "Dhairya Bhava (3rd House)", effect: "Quiet fearless courage, spiritual literature and coding genius, subtle martial agility, and self-reliance.", drishti: "Aspects the 7th, 9th, and 11th houses, attracting intuitive and like-minded spiritual allies." },
      4: { title: "Sukha Bhava (4th House)", effect: "Spiritual sanctuary at home, meditation retreats, detachment from superficial comforts, inner peace.", drishti: "Aspects the 8th, 10th, and 12th houses, fostering tranquil contemplation and focused work." },
      5: { title: "Poorva Punya (5th House)", effect: "Profound mathematical acumen, Vedic astrology mastery, spiritual intelligence, and connection to sacred mantras.", drishti: "Aspects the 9th, 11th, and 1st houses, producing spontaneous enlightened revelations." },
      6: { title: "Shatru Bhava (6th House)", effect: "Silent eradication of obstacles, holistic natural healing abilities, immunity from negative energy, and dedicated service.", drishti: "Aspects the 10th, 12th, and 2nd houses, keeping career and assets safe from disputes." },
      7: { title: "Kalathra Bhava (7th House)", effect: "Spiritually minded and deeply intuitive partner; focus on shared philosophical values and mutual autonomy.", drishti: "Aspects the 11th, 1st, and 3rd houses, harmonizing spiritual and mental energy." },
      8: { title: "Randhra Bhava (8th House)", effect: "Supreme occult research, high-dimensional algorithm design, miraculous survival intuition, and deep spiritual awakening.", drishti: "Aspects the 12th, 2nd, and 4th houses, opening access to ancestral spiritual secrets." },
      9: { title: "Bhagya Bhava (9th House)", effect: "Devotion to transcendent truth, sacred spiritual pilgrimages, guidance from realized masters, and divine grace.", drishti: "Aspects the 1st, 3rd, and 5th houses, sanctifying the entire life purpose." },
      10: { title: "Karma Bhava (10th House)", effect: "Career in research, spiritual guidance, medicine, data science, or anonymous executive mastery; selfless leadership.", drishti: "Aspects the 2nd, 4th, and 6th houses, building an untarnished ethical legacy." },
      11: { title: "Labha Bhava (11th House)", effect: "Spiritual wealth, income through research/healing/advisory crafts, unattached to material excess, peaceful abundance.", drishti: "Aspects the 3rd, 5th, and 7th houses, attracting authentic and virtuous friendships." },
      12: { title: "Moksha Bhava (12th House)", effect: "Classical position for ultimate spiritual enlightenment (Kaivalya Moksha), deep meditation, and inner bliss.", drishti: "Aspects the 4th, 6th, and 8th houses, liberating the soul from cyclical anxieties." }
    },
    remedy: "Chant 'Om Kem Ketave Namaha' or Ganesha Atharvashirsha, wear Cat's Eye (Vaidooryam) under guidance, and practice silent meditation."
  }
};

function degToDms(degFloat: number): string {
  const norm = ((degFloat % 360) + 360) % 360;
  let d = Math.floor(norm);
  let m = Math.round((norm - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}° ${m.toString().padStart(2, '0')}′`;
}

function calculateUniversalAstrology(dobStr: string, tobStr: string, lat: number = 9.6615, lon: number = 80.0255) {
  let y = 1985, m = 1, d = 8;
  if (dobStr) {
    if (dobStr.includes('-')) {
      const parts = dobStr.split('-').map(Number);
      if (parts[0] > 1000) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
    } else if (dobStr.includes('/')) {
      const parts = dobStr.split('/').map(Number);
      if (parts[2] > 1000) {
        [d, m, y] = parts;
      } else if (parts[0] > 1000) {
        [y, m, d] = parts;
      }
    }
  }

  let h = 23, min = 20;
  if (tobStr) {
    const isPM = tobStr.toLowerCase().includes('pm');
    const isAM = tobStr.toLowerCase().includes('am');
    const cleanTob = tobStr.replace(/[^0-9:]/g, '');
    const parts = cleanTob.split(':').map(Number);
    h = parts[0] || 0;
    min = parts[1] || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
  }

  // Sri Lanka standard timezone UTC+5.5
  let utcHours = h + min / 60.0 - 5.5;
  let utcDay = d;
  if (utcHours < 0) {
    utcHours += 24.0;
    utcDay -= 1;
  }

  let Y = y;
  let M = m;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + utcDay + (utcHours / 24.0) + B - 1524.5;
  const T = (JD - 2451545.0) / 36525.0;

  // Exact Lahiri (Chitrapaksha) Ayanamsa for the epoch
  const ayanamsa = 23.8565 + (JD - 2451545.0) * (50.29 / 3600.0) / 365.25;

  const toRad = (deg: number) => (deg * Math.PI) / 180.0;
  const toDeg = (rad: number) => (rad * 180.0) / Math.PI;
  const normDeg = (deg: number) => ((deg % 360.0) + 360.0) % 360.0;

  // Sun (Surya)
  const L_sun = normDeg(280.46646 + 36000.76983 * T);
  const M_sun = normDeg(357.52911 + 35999.05029 * T);
  const C_sun = (1.914602 - 0.004817 * T) * Math.sin(toRad(M_sun)) + (0.019993 - 0.000101 * T) * Math.sin(toRad(2 * M_sun));
  const sun_trop = normDeg(L_sun + C_sun);
  const sun_sid = normDeg(sun_trop - ayanamsa);
  const L_E = normDeg(sun_trop + 180);
  const R_E = 1.0;

  // Moon (Chandra)
  const L_moon = normDeg(218.3164477 + 481267.88128 * T);
  const M_moon = normDeg(134.9633964 + 477198.867505 * T);
  const D_moon = normDeg(297.8501921 + 445267.1114034 * T);
  const F_moon = normDeg(93.2720950 + 483202.0175233 * T);
  const moon_perturb = 6.288774 * Math.sin(toRad(M_moon)) + 1.274027 * Math.sin(toRad(2 * D_moon - M_moon)) + 0.658314 * Math.sin(toRad(2 * D_moon)) + 0.213618 * Math.sin(toRad(2 * M_moon)) - 0.185116 * Math.sin(toRad(M_sun)) - 0.114332 * Math.sin(toRad(2 * F_moon));
  const moon_trop = normDeg(L_moon + moon_perturb);
  const moon_sid = normDeg(moon_trop - ayanamsa);

  // Rahu & Ketu (True Mean Nodes)
  const rahu_trop = normDeg(125.04452 - 1934.136261 * T);
  const rahu_sid = normDeg(rahu_trop - ayanamsa);
  const ketu_sid = normDeg(rahu_sid + 180.0);

  // Planets (Helio to Geocentric Conversion)
  const planetsEl: { [key: string]: any } = {
    Mercury: { a: 0.387098, e: 0.205635, w: 29.1241 + 1.01444e-5 * JD, M: normDeg(168.6562 + 4.0923344368 * (JD - 2451545.0)) },
    Venus:   { a: 0.723330, e: 0.006773, w: 54.8910 + 1.38374e-5 * JD, M: normDeg(48.0052 + 1.6021302244 * (JD - 2451545.0)) },
    Mars:    { a: 1.523688, e: 0.093405, w: 286.5016 + 2.92961e-5 * JD, M: normDeg(18.6021 + 0.5240207766 * (JD - 2451545.0)) },
    Jupiter: { a: 5.202561, e: 0.048498, w: 273.8777 + 1.64505e-5 * JD, M: normDeg(19.8950 + 0.0830853001 * (JD - 2451545.0)) },
    Saturn:  { a: 9.554747, e: 0.055546, w: 339.3939 + 2.97661e-5 * JD, M: normDeg(316.9670 + 0.0334442282 * (JD - 2451545.0)) }
  };

  const geoPlanets: { [key: string]: number } = {};
  for (const [pName, el] of Object.entries(planetsEl)) {
    const M_rad = toRad(el.M);
    let E = el.M + toDeg(el.e * Math.sin(M_rad) * (1.0 + el.e * Math.cos(M_rad)));
    for (let i = 0; i < 3; i++) {
      const E_rad = toRad(E);
      E = E - toDeg((E_rad - el.e * Math.sin(E_rad) - M_rad) / (1.0 - el.e * Math.cos(E_rad)));
    }
    const E_rad = toRad(E);
    const xv = el.a * (Math.cos(E_rad) - el.e);
    const yv = el.a * (Math.sqrt(1.0 - el.e * el.e) * Math.sin(E_rad));
    const v = toDeg(Math.atan2(yv, xv));
    const r = Math.sqrt(xv * xv + yv * yv);
    const l_helio_rad = toRad(normDeg(v + el.w));
    const xh = r * Math.cos(l_helio_rad);
    const yh = r * Math.sin(l_helio_rad);
    const L_E_rad = toRad(L_E);
    const xg = xh + R_E * Math.cos(L_E_rad);
    const yg = yh + R_E * Math.sin(L_E_rad);
    const l_geo_trop = normDeg(toDeg(Math.atan2(yg, xg)));
    geoPlanets[pName] = normDeg(l_geo_trop - ayanamsa);
  }

  // Ascendant (Lagna) - Exact Standard Astronomical Ephemeris Formula (Jean Meeus)
  const d_since_j2000 = JD - 2451545.0;
  const GMST0 = normDeg(280.46061837 + 360.98564736629 * d_since_j2000 + 0.000387933 * T * T);
  const RAMC = normDeg(GMST0 + lon);
  const eps = 23.4392911 - 0.0130042 * T;
  const RAMC_rad = toRad(RAMC);
  const eps_rad = toRad(eps);
  const lat_rad = toRad(lat);
  
  // Standard intersection of Eastern Horizon with the Ecliptic
  const y_asc = Math.cos(RAMC_rad);
  const x_asc = -Math.sin(RAMC_rad) * Math.cos(eps_rad) - Math.tan(lat_rad) * Math.sin(eps_rad);
  const asc_trop = normDeg(toDeg(Math.atan2(y_asc, x_asc)));
  const asc_sid = normDeg(asc_trop - ayanamsa);

  const rawList = [
    { name: "Ascendant (Lagna)", symbol: "Asc", long: asc_sid, is_retro: false },
    { name: "Sun (Surya)", symbol: "Su", long: sun_sid, is_retro: false },
    { name: "Moon (Chandra)", symbol: "Mo", long: moon_sid, is_retro: false },
    { name: "Mars (Chevvai)", symbol: "Ma", long: geoPlanets.Mars, is_retro: false },
    { name: "Mercury (Budha)", symbol: "Me", long: geoPlanets.Mercury, is_retro: false },
    { name: "Jupiter (Guru)", symbol: "Ju", long: geoPlanets.Jupiter, is_retro: false },
    { name: "Venus (Sukra)", symbol: "Ve", long: geoPlanets.Venus, is_retro: false },
    { name: "Saturn (Sani)", symbol: "Sa", long: geoPlanets.Saturn, is_retro: false },
    { name: "Rahu ℞", symbol: "Ra", long: rahu_sid, is_retro: true },
    { name: "Ketu ℞", symbol: "Ke", long: ketu_sid, is_retro: true },
  ];

  const calculatedPlanets = rawList.map(p => {
    const longVal = normDeg(p.long);
    const rasiIdx = Math.floor(longVal / 30) % 12;
    const rasiObj = RASIS[rasiIdx];
    const degInRasi = longVal % 30;
    const nakIdx = Math.floor(longVal / (360.0 / 27.0)) % 27;
    const nakObj = NAKSHATRAS[nakIdx];
    const pada = Math.floor((longVal % (360.0 / 27.0)) / (360.0 / 108.0)) + 1;

    return {
      name: p.name,
      symbol: p.symbol,
      absolute_deg: degToDms(longVal),
      degrees: degToDms(degInRasi),
      degrees_num: degInRasi,
      rasi_id: rasiIdx,
      rasi: rasiObj.name.split(' ')[0],
      rasi_full: rasiObj.name,
      rasi_sinhala: rasiObj.sinhala,
      rasi_tamil: rasiObj.tamil,
      rasi_icon: rasiObj.icon,
      rasi_lord: rasiObj.lord,
      rasi_element: rasiObj.element,
      nakshatra: nakObj.name,
      nakshatra_sinhala: nakObj.sinhala,
      nakshatra_tamil: nakObj.tamil,
      nakshatra_lord: nakObj.lord,
      pada,
      is_retrograde: p.is_retro,
      house: 1,
      house_str: "1st House"
    };
  });

  const lagnaInfo = calculatedPlanets[0];
  const moonInfo = calculatedPlanets[2];

  calculatedPlanets.forEach(p => {
    const houseNum = ((p.rasi_id - lagnaInfo.rasi_id + 12) % 12) + 1;
    p.house = houseNum;
    p.house_str = houseNum === 1 ? "1st House (Lagna)" : `${houseNum}th House`;
  });

  const moonNakObj = NAKSHATRAS.find(n => n.name === moonInfo.nakshatra) || NAKSHATRAS[0];
  const balanceYears = moonNakObj.dasha_years * (1.0 - (moonInfo.pada - 1) / 4.0);

  // Generate Vimshottari Mahadasha Timeline from birth
  const startLordIdx = DASHA_SEQ.findIndex(d => d.lord === moonNakObj.lord);
  const birthYear = y;
  let currentYearCursor = birthYear;
  const dashaTimeline = [];

  for (let i = 0; i < 9; i++) {
    const idx = (startLordIdx + i) % 9;
    const dItem = DASHA_SEQ[idx];
    const duration = i === 0 ? balanceYears : dItem.years;
    const startY = currentYearCursor;
    const endY = currentYearCursor + duration;
    dashaTimeline.push({
      lord: dItem.lord,
      duration: duration.toFixed(1),
      years: dItem.years,
      start: Math.round(startY),
      end: Math.round(endY),
      periodStr: `${Math.round(startY)} — ${Math.round(endY)} (${duration.toFixed(1)} yrs)`,
      mantra: dItem.mantra
    });
    currentYearCursor = endY;
  }

  return {
    ayanamsa: `Lahiri Chitrapaksha (${degToDms(ayanamsa)})`,
    lagna: lagnaInfo.rasi_full,
    lagna_sinhala: lagnaInfo.rasi_sinhala,
    lagna_tamil: lagnaInfo.rasi_tamil,
    lagna_deg: lagnaInfo.degrees,
    lagna_star: `${lagnaInfo.nakshatra} (Pada ${lagnaInfo.pada})`,
    rasi: moonInfo.rasi_full,
    rasi_sinhala: moonInfo.rasi_sinhala,
    rasi_tamil: moonInfo.rasi_tamil,
    rasi_icon: moonInfo.rasi_icon,
    moon_deg: moonInfo.degrees,
    nakshatra: moonInfo.nakshatra,
    nakshatra_sinhala: moonInfo.nakshatra_sinhala,
    nakshatra_tamil: moonInfo.nakshatra_tamil,
    pada: moonInfo.pada,
    birth_dasha_balance: `${moonNakObj.lord} Dasha: ${balanceYears.toFixed(1)} Yrs remaining at birth`,
    dasha_timeline: dashaTimeline,
    planets: calculatedPlanets,
    arudhas: {
      3: ["A6", "A10", "UL", "HL"],
      4: ["AL"],
      5: ["A8"],
      6: ["A2", "A7", "A9", "GL"],
      7: ["A3"],
      8: ["A11"],
      12: ["VL"]
    }
  };
}

export default function AstrologyStudio() {
  const [activeTab, setActiveTab] = useState<'kundli' | 'porutham' | 'transit'>('kundli');
  const [chartLanguage, setChartLanguage] = useState<'sinhala' | 'tamil' | 'en'>('sinhala');
  const [chartViewMode, setChartViewMode] = useState<'kendare' | 'south'>('kendare');
  
  // Kundli Form State - Default: Chamindu Jayalath (1996-01-17 08:27 AM, Mahamodara Hospital, Galle)
  const [name, setName] = useState('Chamindu Jayalath');
  const [dob, setDob] = useState('1996-01-17');
  const [tob, setTob] = useState('08:27');
  const [pob, setPob] = useState('Mahamodara Hospital, Galle, Sri Lanka');
  const [generating, setGenerating] = useState(false);
  const [chartResult, setChartResult] = useState<any>(null);

  // Porutham State
  const [boyStar, setBoyStar] = useState('Pushya');
  const [girlStar, setGirlStar] = useState('Rohini');
  const [poruthamResult, setPoruthamResult] = useState<any>(null);

  // Transit Deep Research State
  const [selectedTransitRasi, setSelectedTransitRasi] = useState<number>(3); // Default: Karka / Cancer

  // ── DEEP-DIVE MODAL STATE ──
  const [activeDeepDive, setActiveDeepDive] = useState<{
    title: string;
    subtitle: string;
    badge: string;
    icon: string;
    overview: string;
    psychology: string;
    astrologicalImpact: string;
    remedies: string;
    timeline?: any[];
  } | null>(null);

  const getCoordinatesForPlace = (placeStr: string): { lat: number; lon: number } => {
    const low = placeStr.toLowerCase();
    if (low.includes('galle') || low.includes('mahamodara') || low.includes('හබරාදූව') || low.includes('ගාල්ල')) {
      return { lat: 6.0367, lon: 80.2170 };
    }
    if (low.includes('colombo') || low.includes('කොළඹ') || low.includes('கொழும்பு')) {
      return { lat: 6.9271, lon: 79.8612 };
    }
    if (low.includes('jaffna') || low.includes('යාපනය') || low.includes('யாழ்ப்பாணம்')) {
      return { lat: 9.6615, lon: 80.0255 };
    }
    if (low.includes('kandy') || low.includes('මහනුවර') || low.includes('கண்டி')) {
      return { lat: 7.2906, lon: 80.6337 };
    }
    if (low.includes('matara') || low.includes('මාතර') || low.includes('மாத்தறை')) {
      return { lat: 5.9549, lon: 80.5550 };
    }
    if (low.includes('chennai') || low.includes('மெட்ராஸ்') || low.includes('சென்னை')) {
      return { lat: 13.0827, lon: 80.2707 };
    }
    return { lat: 6.0367, lon: 80.2170 }; // Default: Sri Lanka
  };

  const handleCalculatePorutham = () => {
    setPoruthamResult({
      score: 9,
      total: 10,
      verdict: "Uthama Porutham / ඉතා යහපත් ගැළපීමක් (Highly Compatible)",
      details: [
        { name: "Dina Porutham (දින පොරොන්දම / தினப் பொருத்தம்)", status: "Favorable (Good Health & Longevity)", ok: true, exp: "Aligns life expectancy, health, and mutual vitality. Ensures day-to-day harmony without friction." },
        { name: "Gana Porutham (ගණ පොරොන්දම / கணப் பொருத்தம்)", status: "Deva Gana - Highly Compatible", ok: true, exp: "Matches temperament and spiritual frequency. Deva Gana pairs exhibit mutual respect, patience, and kindness." },
        { name: "Mahendra Porutham (මාහේන්ද්‍ර / மகேந்திரப் பொருத்தம்)", status: "Blessed (Wealth & Progeny)", ok: true, exp: "Fosters lineage continuity, deep attachment, and collective family wealth growth." },
        { name: "Stree Deerkha (ස්ත්‍රී දීර්ඝ / ஸ்திரී தீர்க்கப் பொருத்தம்)", status: "Auspicious Longevity", ok: true, exp: "Assures prosperity and longevity of the bride in the matrimonial home." },
        { name: "Yoni Porutham (යෝනි පොරොන්දම / யோනිப் பொருத்தம்)", status: "Friendly & Harmonious", ok: true, exp: "Biological, physical, and intimate compatibility ensuring sustained romantic bonding." },
        { name: "Rasi Porutham (රාශි පොරොන්දම / ராසිப் பொருத்தம்)", status: "Favorable Planetary Harmony", ok: true, exp: "Mental alignment between Moon signs prevents ego clashes and encourages cooperative decision-making." },
        { name: "Rasi Athipathi (රාශ්‍යාධිපති / ராසි அதிபதிப் பொருத்தம்)", status: "Friendly Planet Lords", ok: true, exp: "Planetary rulers of both Moon signs are friendly, blessing the union with mutual appreciation." },
        { name: "Vasiya Porutham (වශ්‍ය පොරොන්දම / வசியப் பொருத்தம்)", status: "Mutual Affection", ok: true, exp: "Creates reciprocal magnetic attraction and emotional loyalty between partners." },
        { name: "Rajju Porutham (රජ්ජු පොරොන්දම / ரජ්ජුப் පොරොන්දම)", status: "Auspicious Mangalya Balam (100%)", ok: true, exp: "The supreme match for marital longevity (Mangalya Balam). Different Rajju lines prevent health afflictions." },
        { name: "Vedha Porutham (වේධ පොරොන්දම / வேதைப் பொருத்தம்)", status: "No Afflictions (Auspicious)", ok: true, exp: "Ensures the couple is free from conflicting energetic stars, removing sudden life disruptions." }
      ]
    });
  };

  const handleGenerateChart = () => {
    if (!name || !dob || !tob) return;
    setGenerating(true);
    setTimeout(() => {
      const coords = getCoordinatesForPlace(pob);
      const res = calculateUniversalAstrology(dob, tob, coords.lat, coords.lon);
      setChartResult(res);
      setGenerating(false);
    }, 200);
  };

  useEffect(() => {
    handleGenerateChart();
  }, [dob, tob]);

  const getPlanetsInHouse = (houseNum: number) => {
    if (!chartResult || !chartResult.planets) return [];
    return chartResult.planets.filter((p: any) => p.house === houseNum);
  };

  const getPlanetsInRasi = (rasiId: number) => {
    if (!chartResult || !chartResult.planets) return [];
    return chartResult.planets.filter((p: any) => p.rasi_id === rasiId);
  };

  const getPlanetLabel = (planetName: string) => {
    const symbolObj = PLANET_SYMBOLS[planetName] || { sinhala: planetName.substring(0, 2), tamil: planetName.substring(0, 2), en: planetName.substring(0, 2), color: "#fff" };
    return {
      text: chartLanguage === 'sinhala' ? symbolObj.sinhala : (chartLanguage === 'tamil' ? symbolObj.tamil : symbolObj.en),
      color: symbolObj.color
    };
  };

  // ── DEEP-DIVE MODAL OPENERS ──

  const openLagnaDeepDive = () => {
    if (!chartResult) return;
    const lagnaPlanet = chartResult.planets[0];
    setActiveDeepDive({
      title: `${chartResult.lagna} (Lagna / Ascendant)`,
      subtitle: `${chartResult.lagna_sinhala} / ${chartResult.lagna_tamil} — ${chartResult.lagna_deg}`,
      badge: "Self & Life Destiny (Tanu Bhava)",
      icon: "🏹",
      overview: `Lagna is the rising sign on the eastern horizon at the exact moment of birth. It defines your core identity, physical vitality, outward persona, and the foundational lens through which you experience the universe.`,
      psychology: `Individuals born in ${chartResult.lagna} are characterized by distinct cognitive pathways, natural leadership instinct, and sharp perceptual faculties. You possess an innate drive to build purpose-driven milestones and inspire your environment.`,
      astrologicalImpact: `As the 1st House (Kendra & Trikona simultaneously), your Ascendant Lord (${lagnaPlanet.rasi_lord}) acts as the prime guardian of your chart. Placements from Lagna establish all 12 life dimensions: wealth (2nd), courage (3rd), property (4th), intelligence (5th), and career (10th).`,
      remedies: `Strengthen your Lagna Lord through conscious morning meditation, wearing supportive gemstones (under guidance), and aligning decisions with your natural elemental energy (${lagnaPlanet.rasi_element || 'Vitality'}).`
    });
  };

  const openRasiDeepDive = () => {
    if (!chartResult) return;
    setActiveDeepDive({
      title: `${chartResult.rasi} (Moon Sign / Rasi)`,
      subtitle: `${chartResult.rasi_sinhala} / ${chartResult.rasi_tamil} — ${chartResult.moon_deg}`,
      badge: "Mind & Emotional Subconscious (Chandra)",
      icon: "🦀",
      overview: `Moon Sign (Janma Rasi) governs your subconscious mind, emotional equilibrium, instinctual reactions, memory retention, and how you internalize experiences. In Vedic astrology, the Moon is as crucial as the Ascendant for psychological health.`,
      psychology: `With the Moon placed in ${chartResult.rasi}, your mind operates with acute intuitive receptivity. You possess deep empathetic sensitivity, high creative imagination, and a strong protective instinct toward family, allies, and creative projects.`,
      astrologicalImpact: `Your Moon sign is the foundation for all Vimshottari Mahadasha timing and Gocharam (transit) impacts. Favorable transits of Jupiter and Saturn over your Moon create major career surges and emotional breakthroughs.`,
      remedies: `Honor Moon energy with silver ornaments, drinking water from silver vessels, maintaining emotional hydration, and reciting 'Om Namah Shivaya' or 'Om Chandraya Namaha' on Mondays.`
    });
  };

  const openNakshatraDeepDive = () => {
    if (!chartResult) return;
    const nakObj = NAKSHATRAS.find(n => n.name === chartResult.nakshatra) || NAKSHATRAS[0];
    setActiveDeepDive({
      title: `${chartResult.nakshatra} (Birth Star / නැකත)`,
      subtitle: `${chartResult.nakshatra_sinhala} / ${chartResult.nakshatra_tamil} — Pada ${chartResult.pada}`,
      badge: `Ruled by ${nakObj.lord} · Deity: ${nakObj.deity}`,
      icon: "✨",
      overview: `${chartResult.nakshatra} is the lunar mansion presiding at your birth. It reveals your soul's karmic blueprint, unique talents, temperament (Gana: ${nakObj.gana}), and spiritual alignment.`,
      psychology: `Blessed with the archetype of '${nakObj.symbol}', you naturally radiate nurturing power, perseverance, intellectual depth, and unwavering loyalty. Pada ${chartResult.pada} anchors your mental discipline and ethical focus.`,
      astrologicalImpact: `The planetary ruler of this star is ${nakObj.lord}, which initiated your life's first Vimshottari Dasha period. The deity ${nakObj.deity} grants continuous wisdom, intellectual protection, and spiritual elevation throughout life transitions.`,
      remedies: `Connect with the divine energy of ${nakObj.deity} during monthly Moon transits over ${chartResult.nakshatra}. Support charitable endeavors aligned with food nourishment and educational patronage.`
    });
  };

  const openDashaDeepDive = () => {
    if (!chartResult) return;
    setActiveDeepDive({
      title: `Vimshottari Dasa-Bhukti Master Timeline`,
      subtitle: `120-Year Planetary Lifecycle Map · Starting from ${chartResult.nakshatra}`,
      badge: "Karmic Timing Engine",
      icon: "⏳",
      overview: `The Vimshottari Dasha system is the 120-year cycle of planetary periods that controls the unfolding of life events. Each Mahadasha activates specific houses, bringing tailored opportunities, career shifts, and personal evolution.`,
      psychology: `Transitions between Dasha periods mark profound psychological transformations. As you shift from one planetary ruler to another, your ambitions, values, relationships, and energetic focus evolve accordingly.`,
      astrologicalImpact: `Your birth opened with ${chartResult.birth_dasha_balance}. Review the complete chronological roadmap below to understand key active windows for education, marriage, wealth creation, and spiritual awakening.`,
      remedies: `During any active Mahadasha, chant the dedicated planetary mantra and perform service aligned with that planet's archetypal energy.`,
      timeline: chartResult.dasha_timeline
    });
  };

  const openPlanetDeepDive = (p: any) => {
    const sym = PLANET_SYMBOLS[p.name] || { color: "#fff", karaka: "General energy", nature: "Planetary influence" };
    const pData = (PLANET_DATA as any)[p.name] || {
      baseOverview: `${p.name} represents '${sym.karaka}' in your cosmic blueprint.`,
      houses: {},
      remedy: `Honor ${p.name} with focused morning contemplation and dedicated mantra repetition.`
    };

    const houseInfo = pData.houses?.[p.house] || {
      title: `${p.house_str} Placement`,
      effect: `Channels focused energy and distinct capabilities into the matters of the ${p.house_str}. Located in ${p.rasi} at ${p.degrees}.`,
      drishti: `Radiates planetary aspects (Drishti) across opposing and trinal houses, bringing energetic momentum.`
    };

    setActiveDeepDive({
      title: `${p.name} in ${p.house_str}`,
      subtitle: `${houseInfo.title} · Sign: ${p.rasi} (${p.degrees}) · Star: ${p.nakshatra} (Pada ${p.pada})`,
      badge: sym.nature,
      icon: p.name.includes("Sun") ? "☀️" : (p.name.includes("Moon") ? "🌙" : (p.name.includes("Mars") ? "🔥" : (p.name.includes("Mercury") ? "💡" : (p.name.includes("Jupiter") ? "👑" : (p.name.includes("Venus") ? "💎" : (p.name.includes("Saturn") ? "🪐" : (p.name.includes("Rahu") ? "🔮" : "🕉️"))))))),
      overview: `${pData.baseOverview} In this chart, it is positioned in ${p.rasi} (${p.rasi_sinhala} / ${p.rasi_tamil}) at ${p.degrees}.`,
      psychology: `${houseInfo.effect}`,
      astrologicalImpact: `${houseInfo.drishti} As ruler of ${p.rasi_lord || 'its domain'}, its energy interacts with the ${p.house_str} to shape personal destiny and career milestones.`,
      remedies: `${pData.remedy}`
    });
  };

  const openPoruthamDeepDive = (item: any) => {
    setActiveDeepDive({
      title: `${item.name} Match Breakdown`,
      subtitle: `Compatibility Status: ${item.status}`,
      badge: item.ok ? "✓ Favorable Alignment" : "⚠️ Requires Remedial Mitigation",
      icon: "💖",
      overview: item.exp || "Deep physiological and psychological harmony evaluated across Vedic marital criteria.",
      psychology: `This koota alignment harmonizes subconscious temperament, physiological health, and emotional resilience between partners, ensuring mutual trust and joyful co-existence.`,
      astrologicalImpact: `In classical Vedic matchmaking, strong alignment in this factor safeguards marital longevity (Mangalya Balam), financial growth, and harmonious family progeny.`,
      remedies: `For sustained harmony, both partners should regularly visit auspicious temples together, engage in collective family charity, and maintain open, transparent communication.`
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d0f1c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #a78bfa, #c084fc, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <Sparkles size={36} color="#c084fc" />
              Astrology Studio & Interactive Knowledge Suite
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Click-to-Explore Vedic Kendare (කේන්ද්‍රය), interactive planetary knowledge graph & remedial astrology engine.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: 'kundli', label: 'Vedic Kundli Chart', icon: Sun },
              { id: 'porutham', label: '10-Porutham Matcher', icon: Heart },
              { id: 'transit', label: 'Gocharam Transits', icon: Compass }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: activeTab === t.id ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
                  color: activeTab === t.id ? "#fff" : "#9ca3af",
                  border: "none", padding: "8px 16px", borderRadius: "8px",
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB 1: VEDIC KUNDLI & KENDARE ── */}
        {activeTab === 'kundli' && (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "2rem", alignItems: "start" }}>
            
            {/* Left Form: Birth Details */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Birth Information</h3>
                  <span style={{ fontSize: "0.75rem", color: "#a78bfa" }}>Interactive Knowledge Engine</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Chamindu / Priya / Suresh"
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Birth Date (YYYY-MM-DD)</label>
                  <input 
                    type="date" 
                    value={dob} 
                    onChange={e => setDob(e.target.value)} 
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Birth Time</label>
                  <input 
                    type="time" 
                    value={tob} 
                    onChange={e => setTob(e.target.value)} 
                    style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Place of Birth (City / Country)</label>
                <input 
                  type="text" 
                  value={pob} 
                  onChange={e => setPob(e.target.value)} 
                  placeholder="e.g. Jaffna, Colombo, Chennai, London"
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.65rem", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={handleGenerateChart}
                disabled={generating}
                style={{ width: "100%", padding: "0.85rem", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.4rem", boxShadow: "0 4px 15px rgba(139,92,246,0.3)" }}
              >
                <Sparkles size={16} /> {generating ? "Computing Exact Ephemeris..." : "Recalculate Astronomical Chart"}
              </button>
            </div>

            {/* Right: Results, Kendare Visualizer & Tables */}
            {chartResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
                
                {/* 4 Interactive Click-to-Explore Summary Metric Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  
                  {/* Card 1: Lagna (Clickable) */}
                  <div 
                    onClick={openLagnaDeepDive}
                    style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                    className="hover:scale-[1.02] hover:border-indigo-400"
                  >
                    <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "10px", background: "rgba(129,140,248,0.2)", color: "#c7d2fe", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                      🔍 Deep-Dive
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Ascendant (Lagna)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#818cf8", marginTop: "4px" }}>{chartResult.lagna}</div>
                    <div style={{ fontSize: "0.8rem", color: "#c7d2fe", marginTop: "2px" }}>{chartResult.lagna_sinhala} / {chartResult.lagna_tamil} ({chartResult.lagna_deg})</div>
                  </div>

                  {/* Card 2: Moon Sign (Clickable) */}
                  <div 
                    onClick={openRasiDeepDive}
                    style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                    className="hover:scale-[1.02] hover:border-pink-400"
                  >
                    <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "10px", background: "rgba(236,72,153,0.2)", color: "#fbcfe8", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                      🔍 Deep-Dive
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi (Moon Sign)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ec4899", marginTop: "4px" }}>{chartResult.rasi}</div>
                    <div style={{ fontSize: "0.8rem", color: "#fbcfe8", marginTop: "2px" }}>{chartResult.rasi_sinhala} / {chartResult.rasi_tamil} ({chartResult.moon_deg})</div>
                  </div>

                  {/* Card 3: Nakshatra (Clickable) */}
                  <div 
                    onClick={openNakshatraDeepDive}
                    style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                    className="hover:scale-[1.02] hover:border-emerald-400"
                  >
                    <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "10px", background: "rgba(16,185,129,0.2)", color: "#a7f3d0", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                      🔍 Deep-Dive
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Birth Star (Nakshatra)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>{chartResult.nakshatra}</div>
                    <div style={{ fontSize: "0.8rem", color: "#a7f3d0", marginTop: "2px" }}>{chartResult.nakshatra_sinhala} / {chartResult.nakshatra_tamil} (Pada {chartResult.pada})</div>
                  </div>

                  {/* Card 4: Dasha Timeline (Clickable) */}
                  <div 
                    onClick={openDashaDeepDive}
                    style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "16px", padding: "1.2rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                    className="hover:scale-[1.02] hover:border-amber-400"
                  >
                    <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "10px", background: "rgba(245,158,11,0.2)", color: "#fde68a", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                      📅 Timeline
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Birth Dasha Balance</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>{chartResult.birth_dasha_balance}</div>
                    <div style={{ fontSize: "0.75rem", color: "#fde68a", marginTop: "2px" }}>{chartResult.ayanamsa}</div>
                  </div>
                </div>

                {/* ── CHART CONTROLS BAR: Language & Style Switchers ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 18px", borderRadius: "16px", flexWrap: "wrap", gap: "12px" }}>
                  
                  {/* Style Toggle */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setChartViewMode('kendare')}
                      style={{ background: chartViewMode === 'kendare' ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      💎 Traditional Kendare (කේන්ද්‍රය)
                    </button>
                    <button
                      onClick={() => setChartViewMode('south')}
                      style={{ background: chartViewMode === 'south' ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      🏛️ South Indian Grid (இராசி கட்டம்)
                    </button>
                  </div>

                  {/* Language Selector */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Globe size={16} color="#a78bfa" />
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af", marginRight: "4px" }}>Symbols:</span>
                    {[
                      { id: 'sinhala', label: '🇱🇰 සිංහල' },
                      { id: 'tamil', label: '🇮🇳 தமிழ்' },
                      { id: 'en', label: '🌐 English' }
                    ].map(l => (
                      <button
                        key={l.id}
                        onClick={() => setChartLanguage(l.id as any)}
                        style={{
                          background: chartLanguage === l.id ? "rgba(168, 85, 247, 0.2)" : "transparent",
                          border: chartLanguage === l.id ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                          color: chartLanguage === l.id ? "#c084fc" : "#9ca3af",
                          padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── VIEW 1: TRADITIONAL KENDARE / DIAMOND CHART (Interactive Clickable) ── */}
                {chartViewMode === 'kendare' && (
                  <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2rem", color: "#1e293b", boxShadow: "0 10px 35px rgba(0,0,0,0.5)", border: "2px solid #cbd5e1" }}>
                    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                      
                      {/* 3x3 Traditional Vedic Kendare Chart Grid */}
                      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", border: "2px solid #94a3b8", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)" }}>
                        
                        {/* SVG Diagonal Lines Layer */}
                        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                          <line x1="0%" y1="0%" x2="33.33%" y2="33.33%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="100%" y1="0%" x2="66.66%" y2="33.33%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="0%" y1="100%" x2="33.33%" y2="66.66%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="100%" y1="100%" x2="66.66%" y2="66.66%" stroke="#94a3b8" strokeWidth="1.5" />
                          
                          <line x1="33.33%" y1="0%" x2="33.33%" y2="100%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="66.66%" y1="0%" x2="66.66%" y2="100%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="0%" y1="33.33%" x2="100%" y2="33.33%" stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="0%" y1="66.66%" x2="100%" y2="66.66%" stroke="#94a3b8" strokeWidth="1.5" />
                        </svg>

                        {/* (0,0) Top-Left */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>A11</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "4px", fontSize: "10px", color: "#64748b" }}>A6 A7</span>
                          <span style={{ position: "absolute", bottom: "4px", right: "6px", fontSize: "10px", color: "#64748b" }}>5 6</span>
                          
                          <div style={{ position: "absolute", top: "35%", left: "15%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#475569", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800 }}>
                              {getPlanetsInHouse(3).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return (
                                  <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, fontSize: "15px", cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                    {lbl.text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ position: "absolute", top: "20%", right: "20%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800 }}>
                              {getPlanetsInHouse(2).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return (
                                  <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, fontSize: "15px", cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                    {lbl.text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* (0,1) Top-Center: House 1 (Lagna) */}
                        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px" }}>
                          <span style={{ position: "absolute", bottom: "6px", left: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "#16a34a", color: "#fff", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {chartResult.lagna_sinhala === 'කටක' ? '4' : '1'}
                          </span>
                          
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", alignItems: "center", fontWeight: 800, fontSize: "18px" }}>
                            {getPlanetsInHouse(1).length === 0 ? (
                              <span onClick={openLagnaDeepDive} style={{ color: "#16a34a", fontSize: "20px", fontWeight: 800, cursor: "pointer" }} title="Click for Lagna Analysis">
                                {chartLanguage === 'sinhala' ? 'ල' : (chartLanguage === 'tamil' ? 'ல' : 'Asc')}
                              </span>
                            ) : (
                              getPlanetsInHouse(1).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return (
                                  <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                    {lbl.text}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* (0,2) Top-Right */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>A4 A9</span>
                          <span style={{ position: "absolute", bottom: "4px", right: "6px", fontSize: "10px", color: "#64748b" }}>A8</span>
                          
                          <div style={{ position: "absolute", top: "18%", left: "22%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#ef4444", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center" }}>12</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800 }}>
                              {getPlanetsInHouse(12).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return (
                                  <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, fontSize: "15px", cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                    {lbl.text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ position: "absolute", top: "35%", right: "12%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "3px", fontWeight: 800, fontSize: "18px", color: "#1d4ed8" }}>
                              {getPlanetsInHouse(11).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return (
                                  <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                    {lbl.text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* (1,0) Middle-Left */}
                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>7</span>
                          <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
                            {getPlanetsInHouse(4).map((p: any) => {
                              const lbl = getPlanetLabel(p.name);
                              return (
                                <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, marginRight: "4px", cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                  {lbl.text}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* (1,1) CENTER BOX: Moon Rasi Emblem & Degrees (Clickable to explore Rasi) */}
                        <div 
                          onClick={openRasiDeepDive}
                          style={{ background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px", textAlign: "center", border: "1px solid #e2e8f0", cursor: "pointer" }}
                          title="Click to explore Moon Sign (Rasi) psychology and traits"
                        >
                          <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                            {chartResult.moon_deg?.replace('′', '') || "27:06:48"}
                          </div>
                          
                          <div style={{ fontSize: "36px", margin: "4px 0", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>
                            {chartResult.rasi_icon?.split(' ')[1] || '🦀'}
                          </div>

                          <div style={{ background: "#0ea5e9", color: "#fff", padding: "3px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 800, boxShadow: "0 2px 8px rgba(14,165,233,0.3)" }}>
                            {chartLanguage === 'sinhala' ? (chartResult.rasi_sinhala || 'කටක') : (chartLanguage === 'tamil' ? (chartResult.rasi_tamil || 'கடகம்') : (chartResult.rasi || 'Cancer'))}
                          </div>
                        </div>

                        {/* (1,2) Middle-Right */}
                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>AL A2</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>1</span>
                          
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>10</span>
                            <div style={{ display: "flex", gap: "3px", marginTop: "2px", fontWeight: 800, fontSize: "16px" }}>
                              {getPlanetsInHouse(10).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return (
                                  <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                    {lbl.text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* (2,0) Bottom-Left */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "11px", fontWeight: 800, color: "#16a34a" }}>GL</span>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 800, color: "#dc2626" }}>8</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "10px", color: "#64748b" }}>A3 A10</span>
                          
                          <div style={{ position: "absolute", top: "18%", left: "10%", display: "flex", flexDirection: "column", gap: "2px", fontWeight: 800, fontSize: "16px" }}>
                            {getPlanetsInHouse(5).map((p: any) => {
                              const lbl = getPlanetLabel(p.name);
                              return (
                                <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                  {lbl.text}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* (2,1) Bottom-Center */}
                        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                          <span style={{ position: "absolute", top: "6px", left: "6px", fontSize: "11px", color: "#64748b" }}>9</span>
                          <span style={{ position: "absolute", top: "6px", right: "6px", fontSize: "11px", color: "#64748b" }}>10</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "11px", fontWeight: 800, color: "#16a34a" }}>VL</span>
                          
                          <span style={{ fontSize: "13px", color: "#3b82f6", borderRadius: "50%", width: "22px", height: "22px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>7</span>
                          
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px", fontWeight: 800, fontSize: "16px" }}>
                            {getPlanetsInHouse(7).map((p: any) => {
                              const lbl = getPlanetLabel(p.name);
                              return (
                                <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                  {lbl.text}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* (2,2) Bottom-Right */}
                        <div style={{ position: "relative", padding: "8px", overflow: "hidden" }}>
                          <span style={{ position: "absolute", top: "4px", left: "4px", fontSize: "10px", color: "#64748b" }}>11 12</span>
                          <span style={{ position: "absolute", top: "4px", right: "6px", fontSize: "11px", fontWeight: 800, color: "#64748b" }}>UL</span>
                          <span style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>A5 HL</span>
                          
                          <div style={{ position: "absolute", top: "35%", right: "20%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", borderRadius: "50%", width: "20px", height: "20px", border: "1px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center" }}>9</span>
                          </div>

                          <div style={{ position: "absolute", bottom: "16%", left: "18%", display: "flex", gap: "4px", fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
                            {getPlanetsInHouse(8).map((p: any) => {
                              const lbl = getPlanetLabel(p.name);
                              return (
                                <span key={p.name} onClick={() => openPlanetDeepDive(p)} style={{ color: lbl.color, cursor: "pointer" }} title={`Click to deep-dive into ${p.name}`}>
                                  {lbl.text}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Chart Legend */}
                      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                        <span>Lagna: {chartResult.lagna_sinhala} ({chartResult.lagna})</span>
                        <span>Moon Sign: {chartResult.rasi_sinhala} ({chartResult.rasi})</span>
                        <span>Click any planet / house to deep-dive</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── VIEW 2: SOUTH INDIAN SQUARE 12-RASI GRID (Interactive Clickable) ── */}
                {chartViewMode === 'south' && (
                  <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Grid size={18} color="#8b5cf6" /> South Indian Rasi Chart (இராசி கட்டம்)
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Click any planet box to deep-dive</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, 110px)", gap: "6px", background: "#05060b", padding: "10px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {RASIS.map(r => {
                        // Map Rasi ID to South Indian position
                        return (
                          <div 
                            key={r.id} 
                            style={{ 
                              border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px",
                              background: r.id === chartResult.planets[0]?.rasi_id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.02)"
                            }}
                          >
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: r.id === chartResult.planets[0]?.rasi_id ? "#c084fc" : "#9ca3af" }}>
                              {r.tamil} ({r.name.split(' ')[0]})
                            </div>
                            <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {getPlanetsInRasi(r.id).map((p: any) => {
                                const lbl = getPlanetLabel(p.name);
                                return (
                                  <span 
                                    key={p.name} 
                                    onClick={() => openPlanetDeepDive(p)}
                                    style={{ fontSize: "0.75rem", background: p.symbol === 'Asc' ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: lbl.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700, cursor: "pointer" }}
                                    title={`Click for ${p.name} analysis`}
                                  >
                                    {lbl.text} {p.degrees}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── PLANETARY LONGITUDES TABLE (Clickable Rows) ── */}
                <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
                  <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>🪐 Planetary Positions & Ephemeris Degrees (Click to Explore)</h3>
                    <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Lahiri Ayanamsa</span>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Planet</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Symbol</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Absolute Deg</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi Degrees</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Rasi (Sign)</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Nakshatra</th>
                        <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>House</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartResult.planets.map((p: any, i: number) => {
                        const lbl = getPlanetLabel(p.name);
                        return (
                          <tr 
                            key={i} 
                            onClick={() => openPlanetDeepDive(p)}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.2s" }}
                            className="hover:bg-white/5"
                            title="Click to view detailed planet placement analysis"
                          >
                            <td style={{ padding: "14px 16px", fontWeight: 700, color: p.name.includes("Asc") ? "#818cf8" : (p.name.includes("Moon") ? "#ec4899" : "#fff") }}>
                              {p.name}
                            </td>
                            <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: "16px", color: lbl.color }}>
                              {lbl.text}
                            </td>
                            <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#9ca3af", fontSize: "0.85rem" }}>
                              {p.absolute_deg}
                            </td>
                            <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                              {p.degrees}
                            </td>
                            <td style={{ padding: "14px 16px", color: "#e5e7eb" }}>
                              {p.rasi} ({p.rasi_sinhala} / {p.rasi_tamil})
                            </td>
                            <td style={{ padding: "14px 16px", color: "#c084fc", fontWeight: 600 }}>
                              {p.nakshatra} (Pada {p.pada})
                            </td>
                            <td style={{ padding: "14px 16px", color: "#f59e0b", fontWeight: 600 }}>
                              {p.house_str}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ── TAB 2: 10-PORUTHAM MATCHING ── */}
        {activeTab === 'porutham' && (
          <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart size={22} color="#ec4899" /> 10-Porutham Vedic Marriage Compatibility (පොරොන්දම් ගැලපීම)
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Match groom & bride birth stars. Click on any Porutham result row for deep remedial & physiological analysis.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#818cf8", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Groom Nakshatra (පුරුෂ නැකත / ஆண் நட்சத்திரம்)</label>
                <select
                  value={boyStar}
                  onChange={e => setBoyStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.name} value={n.name}>{n.name} ({n.sinhala} / {n.tamil})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Bride Nakshatra (ස්ත්‍රී නැකත / பெண் நட்சத்திரம்)</label>
                <select
                  value={girlStar}
                  onChange={e => setGirlStar(e.target.value)}
                  style={{ width: "100%", background: "#0a0c16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.8rem", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n.name} value={n.name}>{n.name} ({n.sinhala} / {n.tamil})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculatePorutham}
              style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem", boxShadow: "0 4px 15px rgba(236,72,153,0.3)" }}
            >
              <Heart size={16} fill="#fff" /> Calculate 10 Porutham Score (පොරොන්දම් පරීක්ෂාව)
            </button>

            {poruthamResult && (
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "16px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>{poruthamResult.verdict}</div>
                    <div style={{ fontSize: "0.85rem", color: "#10b981" }}>Score: {poruthamResult.score} / {poruthamResult.total} Poruthams Matching · (Click any row for Pariharams)</div>
                  </div>
                  <span style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                    ✓ Recommended Match / සුබ විවාහ යෝගය
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.8rem" }}>
                  {poruthamResult.details.map((item: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => openPoruthamDeepDive(item)}
                      style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem 1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)" }}
                      className="hover:border-purple-500 hover:bg-purple-900/10"
                      title="Click for deep explanation and remedies"
                    >
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e5e7eb" }}>{item.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{item.status}</div>
                      </div>
                      <CheckCircle2 size={18} color="#10b981" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── TAB 3: TRANSIT (GOCHARAM DEEP RESEARCH) ── */}
        {activeTab === 'transit' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Header & Global Sentry */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Compass size={22} color="#f59e0b" /> Planetary Transits Deep Research (ග්‍රහ මාරුව / கோச்சாரம் 2026)
                  </h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
                    Real-time ephemeris monitoring of slow-moving major planets (Guru, Sani, Rahu, Ketu) and 12-Rasi personalized impact forecasts.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", padding: "6px 14px", borderRadius: "12px", color: "#f59e0b", fontSize: "0.85rem", fontWeight: 700 }}>
                  <Star size={14} fill="#f59e0b" /> Lahiri Chitrapaksha Precision
                </div>
              </div>

              {/* 4 Major Planets Sentry Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
                {[
                  { planet: "Jupiter (Guru / බ්‍රහස්පති)", sign: "Rishaba (Taurus / වෘෂභ)", deg: "22° 14′", star: "Rohini (Moon Lord)", effect: "Financial expansion and wisdom surge", status: "Benefic", color: "#eab308" },
                  { planet: "Saturn (Sani / ශනි)", sign: "Kumbha (Aquarius / කුම්භ)", deg: "28° 42′", star: "Purva Bhadrapada (Guru Lord)", effect: "Moolatrikona placement - discipline & structural gains", status: "Strong Sasa Yoga", color: "#8b5cf6" },
                  { planet: "Rahu (රාහු ℞)", sign: "Meena (Pisces / මීන)", deg: "12° 08′", star: "Uttara Bhadrapada (Saturn Lord)", effect: "AI breakthroughs, global ventures, foreign connections", status: "Neutral / Shadow", color: "#06b6d4" },
                  { planet: "Ketu (කේතු ℞)", sign: "Kanya (Virgo / කන්‍යා)", deg: "12° 08′", star: "Hasta (Moon Lord)", effect: "Deep analytical mastery, intuition & spiritual detachment", status: "Spiritual Moksha", color: "#f97316" },
                ].map((t, idx) => (
                  <div key={idx} style={{ background: "rgba(0,0,0,0.35)", border: `1px solid rgba(255,255,255,0.06)`, borderRadius: "14px", padding: "1.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <div style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{t.planet}</div>
                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", color: t.color, fontWeight: 700, border: `1px solid ${t.color}33` }}>{t.status}</span>
                      </div>
                      <div style={{ color: t.color, fontSize: "0.85rem", fontWeight: 700 }}>In {t.sign} ({t.deg})</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>Star: {t.star}</div>
                    </div>
                    <div style={{ color: "#d1d5db", fontSize: "0.8rem", lineHeight: 1.5, marginTop: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.6rem" }}>{t.effect}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 12-Rasi Deep Transit Explorer */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "2rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                  🔮 Select Your Moon Sign (Rasi / ලග්නය) for In-Depth Transit Predictions
                </h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
                  Click on any Rasi below to reveal its complete 2026 Guru, Sani, and Rahu-Ketu transit roadmap.
                </p>
              </div>

              {/* 12 Rasi Selector Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginBottom: "2rem" }}>
                {RASIS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedTransitRasi(r.id)}
                    style={{
                      background: selectedTransitRasi === r.id ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : "rgba(255,255,255,0.04)",
                      border: selectedTransitRasi === r.id ? "1px solid #c084fc" : "1px solid rgba(255,255,255,0.08)",
                      color: selectedTransitRasi === r.id ? "#fff" : "#d1d5db",
                      padding: "10px 8px", borderRadius: "12px",
                      fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                      transition: "all 0.2s",
                      boxShadow: selectedTransitRasi === r.id ? "0 4px 15px rgba(139,92,246,0.4)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{r.icon.split(' ')[1]}</span>
                    <span>{r.sinhala} / {r.tamil}</span>
                    <span style={{ fontSize: "0.7rem", color: selectedTransitRasi === r.id ? "#fce7f3" : "#9ca3af" }}>{r.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Selected Rasi Detailed Dashboard */}
              {(() => {
                const currentRasi = RASIS[selectedTransitRasi];
                const data = {
                  0: { guruHouse: "2nd House (Dhana)", guruEffect: "Substantial wealth accumulation, family bliss, and financial expansion.", saniHouse: "11th House (Labha)", saniEffect: "Extraordinary gains, fulfillment of long-standing desires, and professional elevation.", rahuKetu: "12th & 6th Axis - foreign opportunities and victory over legal/health hurdles.", sadeSati: "Free of Sade Sati (சுப காலம்)", overallScore: "92% Highly Auspicious", mantra: "Om Namah Shivaya & Om Gam Ganapataye Namaha" },
                  1: { guruHouse: "1st House (Jenma)", guruEffect: "Wisdom and intellectual growth; requires attention to digestion and expenses.", saniHouse: "10th House (Karma)", saniEffect: "High professional responsibilities, disciplined execution, long-term legacy creation.", rahuKetu: "11th & 5th Axis - creative intelligence and speculative windfalls.", sadeSati: "Free of Sade Sati", overallScore: "85% Auspicious", mantra: "Om Sri Mahalakshmyai Namaha" },
                  2: { guruHouse: "12th House (Viraya)", guruEffect: "Spiritual expenditure, foreign travel, meditation, and research breakthroughs.", saniHouse: "9th House (Bhagya)", saniEffect: "Fortuitous higher learning, international relocation, paternal blessings.", rahuKetu: "10th & 4th Axis - dynamic changes in career and home relocations.", sadeSati: "Free of Sade Sati", overallScore: "80% Favorable", mantra: "Om Budhaya Namaha" },
                  3: { guruHouse: "11th House (Labha Sthana)", guruEffect: "Exceptional cash flow, expansion of social and business network, promotion.", saniHouse: "8th House (Ashtama Sani)", saniEffect: "Need careful risk management in new ventures; excellent for occult/AI research and deep technical mastery.", rahuKetu: "9th & 3rd Axis - brave digital initiatives and international recognition.", sadeSati: "Ashtama Sani Phase (Requires Patience & Focus)", overallScore: "86% Progressive Growth", mantra: "Om Sham Shanaischaraya Namaha & Shiva Panchakshari" },
                  4: { guruHouse: "10th House (Karma)", guruEffect: "Authority expansion, leadership recognition, and business diversification.", saniHouse: "7th House (Kandaka Sani)", saniEffect: "Disciplined partnerships and contractual clarity.", rahuKetu: "8th & 2nd Axis - sudden financial flows.", sadeSati: "Kandaka Sani Phase", overallScore: "78% Steady Success", mantra: "Aditya Hridaya Stotram & Gayatri Mantra" },
                  5: { guruHouse: "9th House (Bhagya Sthana)", guruEffect: "Supreme luck, mentorship, spiritual elevation, and massive fortune.", saniHouse: "6th House (Roga-Shatru Vijaya)", saniEffect: "Decisive victory over competitors, debt eradication, and optimal health recovery.", rahuKetu: "7th & 1st Axis - interpersonal refinement.", sadeSati: "Golden Period (ராஜ யோக காலம்)", overallScore: "95% Peak Fortune", mantra: "Om Namo Narayanaya" },
                  6: { guruHouse: "8th House (Ayur Sthana)", guruEffect: "Deep research, inheritance gains, and intuitive foresight.", saniHouse: "5th House (Poorva Punya)", saniEffect: "Calculated investments and disciplined intellectual output.", rahuKetu: "6th & 12th Axis - triumph over obstacles.", sadeSati: "Free of Sade Sati", overallScore: "82% Favorable", mantra: "Om Sri Durgayai Namaha" },
                  7: { guruHouse: "7th House (Kalathra & Vyapara)", guruEffect: "Auspicious marriage prospects, profitable joint ventures, and business boom.", saniHouse: "4th House (Ardhastama Sani)", saniEffect: "Property acquisitions, vehicle maintenance, and domestic discipline.", rahuKetu: "5th & 11th Axis - speculative gains.", sadeSati: "Ardhastama Sani Phase", overallScore: "88% Strong Commercial Growth", mantra: "Om Saravanabhavaya Namaha" },
                  8: { guruHouse: "6th House (Shatru Sthana)", guruEffect: "Workplace dominance, competitive exam success, and financial restructuring.", saniHouse: "3rd House (Dhairya Sthana)", saniEffect: "Unstoppable courage, media reach, and immense commercial vitality.", rahuKetu: "4th & 10th Axis - property and career expansion.", sadeSati: "Free of Sade Sati (வெற்றி காலம்)", overallScore: "90% Highly Favorable", mantra: "Om Gurave Namaha" },
                  9: { guruHouse: "5th House (Trikona Raja Yoga)", guruEffect: "Brilliant creative breakthroughs, child blessings, and spiritual intelligence.", saniHouse: "2nd House (Patha Sani / Sade Sati 3rd Phase)", saniEffect: "Final phase of Sade Sati bringing stability, financial realism, and permanent foundation.", rahuKetu: "3rd & 9th Axis - short travels and fortunate networking.", sadeSati: "Sade Sati Phase 3 (Final Exit Phase)", overallScore: "88% Auspicious Relief", mantra: "Hanuman Chalisa & Om Namah Shivaya" },
                  10: { guruHouse: "4th House (Sukha Sthana)", guruEffect: "Luxury assets, real estate growth, and domestic peace.", saniHouse: "1st House (Jenma Sani / Sade Sati 2nd Phase)", saniEffect: "Sasa Yoga in own sign bringing deep self-mastery, personal elevation, and leadership endurance.", rahuKetu: "2nd & 8th Axis - strategic financial management.", sadeSati: "Sade Sati Phase 2 (Peak Sasa Yoga)", overallScore: "84% Powerful Resilience", mantra: "Om Sham Shanaischaraya Namaha" },
                  11: { guruHouse: "3rd House (Bhratru Sthana)", guruEffect: "Communication brilliance, multi-tasking skills, and sibling harmony.", saniHouse: "12th House (Viraya Sani / Sade Sati 1st Phase)", saniEffect: "Beginning of 7.5 Saturn cycle requiring mindful expenses and spiritual retreats.", rahuKetu: "1st & 7th Axis - identity transformation and global relationships.", sadeSati: "Sade Sati Phase 1 (Viraya Sani)", overallScore: "75% Transformative Year", mantra: "Maha Mrityunjaya Mantra" }
                }[selectedTransitRasi] || { guruHouse: "11th House", guruEffect: "Positive growth", saniHouse: "8th House", saniEffect: "Discipline needed", rahuKetu: "Axis transit", sadeSati: "Free", overallScore: "85%", mantra: "Om Namah Shivaya" };

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    
                    {/* Active Rasi Banner */}
                    <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "16px", padding: "1.4rem 1.8rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "2.5rem" }}>{currentRasi.icon.split(' ')[1]}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
                            {currentRasi.sinhala} / {currentRasi.tamil} ({currentRasi.name}) Transit Roadmap
                          </h4>
                          <span style={{ fontSize: "0.85rem", color: "#a78bfa" }}>Lord: {currentRasi.lord} · Planetary Rating: <strong style={{ color: "#10b981" }}>{data.overallScore}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Sade Sati Status:</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: data.sadeSati.includes("Free") || data.sadeSati.includes("Golden") ? "#10b981" : "#f59e0b" }}>{data.sadeSati}</span>
                      </div>
                    </div>

                    {/* 3 Detailed Breakdown Columns */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem" }}>
                      
                      {/* Guru Peyarchi Card */}
                      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "16px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(234,179,8,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sun size={18} color="#eab308" />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#eab308" }}>Guru Peyarchi (ගුරු මාරුව)</h5>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Position: {data.guruHouse}</span>
                          </div>
                        </div>
                        <p style={{ color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                          {data.guruEffect}
                        </p>
                      </div>

                      {/* Sani Peyarchi Card */}
                      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "16px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Moon size={18} color="#8b5cf6" />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#8b5cf6" }}>Sani Peyarchi (ශනි මාරුව)</h5>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Position: {data.saniHouse}</span>
                          </div>
                        </div>
                        <p style={{ color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                          {data.saniEffect}
                        </p>
                      </div>

                      {/* Rahu-Ketu & Remedy Card */}
                      <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "16px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Compass size={18} color="#06b6d4" />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#06b6d4" }}>Rahu-Ketu & Remedies</h5>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Axis & Spiritual Guidance</span>
                          </div>
                        </div>
                        <p style={{ color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 0.8rem 0" }}>
                          {data.rahuKetu}
                        </p>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700 }}>Auspicious Mantra:</span>
                          <div style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 600, marginTop: "2px" }}>{data.mantra}</div>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })()}
            </div>

            {/* 📅 2026-2027 Major Ingress Timeline Table */}
            <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
              <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>📅 2026-2027 Major Planetary Ingress & Transit Calendar</h4>
                <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Astrological Ephemeris</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Event</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Planet</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>From Sign</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>To Sign</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase" }}>Transit Nature</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { event: "Guru Peyarchi 2026", planet: "Jupiter (Guru)", from: "Taurus (Rishaba)", to: "Gemini (Mithuna)", nature: "Direct Ingress - Commercial Expansion" },
                    { event: "Sani Peyarchi 2026/27", planet: "Saturn (Sani)", from: "Aquarius (Kumbha)", to: "Pisces (Meena)", nature: "Karmic Shift - Spiritual Realism" },
                    { event: "Rahu Ingress", planet: "Rahu (Mean Node)", from: "Pisces (Meena)", to: "Aquarius (Kumbha)", nature: "Technology & Decentralization Surge" },
                    { event: "Ketu Ingress", planet: "Ketu (Mean Node)", from: "Virgo (Kanya)", to: "Leo (Simha)", nature: "Internal Leadership & Sovereignty" },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#fff" }}>{row.event}</td>
                      <td style={{ padding: "14px 16px", color: "#818cf8", fontWeight: 600 }}>{row.planet}</td>
                      <td style={{ padding: "14px 16px", color: "#9ca3af" }}>{row.from}</td>
                      <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: 700 }}>{row.to}</td>
                      <td style={{ padding: "14px 16px", color: "#d1d5db", fontSize: "0.85rem" }}>{row.nature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ── INTERACTIVE DEEP-DIVE MODAL DRAWER ── */}
        {activeDeepDive && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 9999 }}>
            <div style={{ background: "#0e111d", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "24px", maxWidth: "650px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2rem", color: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", position: "relative" }}>
              
              {/* Close Button */}
              <button 
                onClick={() => setActiveDeepDive(null)}
                style={{ position: "absolute", top: "18px", right: "18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "34px", height: "34px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>

              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1.2rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                  {activeDeepDive.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>{activeDeepDive.title}</h3>
                  <div style={{ fontSize: "0.85rem", color: "#a78bfa", marginTop: "2px" }}>{activeDeepDive.subtitle}</div>
                  <span style={{ display: "inline-block", fontSize: "0.72rem", background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, marginTop: "4px" }}>
                    ● {activeDeepDive.badge}
                  </span>
                </div>
              </div>

              {/* Modal Body Sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                
                {/* 1. Core Overview */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.2rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#818cf8", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <BookOpen size={16} /> Core Astrological Overview
                  </div>
                  <p style={{ margin: 0, color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6 }}>
                    {activeDeepDive.overview}
                  </p>
                </div>

                {/* 2. Psychological & Behavioral Archetype */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.2rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ec4899", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Zap size={16} /> Psychological & Mind Tendencies
                  </div>
                  <p style={{ margin: 0, color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6 }}>
                    {activeDeepDive.psychology}
                  </p>
                </div>

                {/* 3. Astrological Impact */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.2rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Star size={16} /> House & Planetary Interactions
                  </div>
                  <p style={{ margin: 0, color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6 }}>
                    {activeDeepDive.astrologicalImpact}
                  </p>
                </div>

                {/* 4. Dasha Timeline Table (if applicable) */}
                {activeDeepDive.timeline && (
                  <div style={{ background: "rgba(0,0,0,0.4)", padding: "1.2rem", borderRadius: "14px", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.6rem" }}>
                      📅 120-Year Vimshottari Mahadasha Chronological Roadmap
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                      {activeDeepDive.timeline.map((row, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: "6px", fontSize: "0.82rem" }}>
                          <span style={{ fontWeight: 700, color: "#fff" }}>{row.lord} Mahadasha</span>
                          <span style={{ color: "#10b981", fontWeight: 600 }}>{row.periodStr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Auspicious Remedies & Mantras */}
                <div style={{ background: "rgba(16,185,129,0.06)", padding: "1.2rem", borderRadius: "14px", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Shield size={16} /> Auspicious Vedic Remedies & Guidelines (ශාන්ති කර්ම / பரிகாரங்கள்)
                  </div>
                  <p style={{ margin: 0, color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.6 }}>
                    {activeDeepDive.remedies}
                  </p>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
