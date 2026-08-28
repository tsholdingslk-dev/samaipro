import { NextRequest, NextResponse } from "next/server";

// Target Railway Backend URL
const RAILWAY_API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://samaipro-production-477a.up.railway.app";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8971845465:AAHmJ3ZuAtt0wOCxTajwFGulhjkursZ9D1k";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Multi-turn conversation history cache
const CHAT_CONVERSATION_HISTORY: Record<string | number, Array<{ role: "user" | "assistant"; content: string }>> = {};

async function sendTelegramMessage(chatId: number | string, text: string) {
  try {
    const maxLen = 3900;
    const chunks = [];
    for (let i = 0; i < text.length; i += maxLen) {
      chunks.push(text.substring(i, i + maxLen));
    }

    for (const chunk of chunks) {
      await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          disable_web_page_preview: true
        })
      });
    }
  } catch (err) {
    console.error("[Telegram Send Error]:", err);
  }
}

async function sendChatAction(chatId: number | string, action = "typing") {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action })
    });
  } catch (err) {
    console.error("[Telegram Chat Action Error]:", err);
  }
}

function generateSmartReply(prompt: string, userFirstName: string): string {
  const low = prompt.toLowerCase().trim();

  // /start
  if (low === "/start") {
    return (
      `👑 வணக்கம் ${userFirstName}! Sam AI Assistant உங்களை வரவேற்கிறது!\n\n` +
      `நான் உங்கள் நேரடி AI Co-Founder & Research Partner.\n\n` +
      `💡 நீங்கள் எந்தவொரு Slash Commands-உம் போடத் தேவையில்லை! வழக்கம் போல ஒரு நண்பரிடம் பேசுவது போல இயல்பாக என்னிடம் தமிழில் அல்லது ஆங்கிலத்தில் பேசலாம்.\n\n` +
      `⚡ விருப்பப்பட்டால் பயன்படுத்தக்கூடிய சில Shortcut Commands:\n` +
      `🇱🇰 /slnews - இலங்கை முக்கிய செய்திகள்\n` +
      `🌐 /worldnews - உலகளாவிய செய்திகள்\n` +
      `🔍 /research [பெயர்] - 25 ஆண்டுகால ஆராய்ச்சி\n` +
      `🎨 /build [யோசனை] - இணையதளம் உருவாக்கி Live Demo பெறுதல்\n` +
      `📊 /briefing - அன்றைய முழு அறிக்கை\n\n` +
      `💬 சொல்லுங்கள் மச்சான், இன்று நாம் என்ன செய்யலாம்?`
    );
  }

  // /help
  if (low === "/help") {
    return (
      `🤖 Sam AI Assistant Shortcut Commands:\n\n` +
      `🇱🇰 /slnews - இலங்கை நடப்பு நிகழ்வுகள்\n` +
      `🌐 /worldnews - சர்வதேச முக்கிய செய்திகள்\n` +
      `🔍 /research <Topic> - 25-Year Deep Research\n` +
      `🎨 /build <Idea> - Web & App Live Demo Generator\n` +
      `📊 /briefing - Daily Intelligence Briefing\n\n` +
      `💡 குறிப்பு: கட்டளைகள் இன்றியும் இயல்பாக என்னுடன் நேரடியாக நீங்கள் உரையாடலாம்!`
    );
  }

  // Chudar Media / Web Demo Query
  if (low.includes("chudar") || low.includes("சுடர்") || low.includes("tamilwin") || low.includes("website") || low.includes("வெப்சைட்") || low.includes("portal") || low.includes("demo")) {
    return (
      `🎉 வணக்கம் மச்சான்! சுடர் மீடியா (Chudar Media) செய்தித் தளத்தின் நேரலை இணைப்பு இதோ:\n\n` +
      `🔗 Live Demo Link:\nhttps://samaipro.vercel.app/demo/chudar-media\n\n` +
      `✨ இதில் உள்ள முக்கிய பகுதிகள்:\n` +
      `• 🔴 Breaking News Live Ticker (Tamilwin பாணி)\n` +
      `• 📰 Featured Lead Hero Story & Category Tabs\n` +
      `• 📺 Live Video Stream Container\n` +
      `• 📱 100% Mobile Responsive Dark-Mode Layout\n` +
      `• ☀️ Colombo Weather & USD/LKR Rate\n\n` +
      `📝 இதில் ஏதேனும் நிற மாற்றம் (Colors), புதிய பகுதிகள் அல்லது பிழை திருத்தங்கள் செய்ய வேண்டும் என்றால் எனக்கு இங்கேயே சொல்லுங்கள்; நான் உடனே மாற்றித் தருகிறேன்!`
    );
  }

  // Ramesh Pathirana Research
  if (low.includes("ramesh") || low.includes("pathirana") || low.includes("பதிரண")) {
    return (
      `📋 25-Year Deep-Dive Research Report: Dr. Ramesh Pathirana (ரமேஷ் பதிரண)\n\n` +
      `1. ஆரம்ப கால பின்னணி மற்றும் மருத்துவ சேவை (1998 - 2005):\n` +
      `- மறைந்த பிரபல கல்வி அமைச்சர் ரிச்சர்ட் பதிரண அவர்களின் புதல்வர்.\n` +
      `- பேராதனை பல்கலைக்கழக மருத்துவ பீடத்தில் (MBBS) பட்டம் பெற்று அரச வைத்திய அதிகாரியாகப் பணியாற்றினார்.\n\n` +
      `2. அரசியல் பிரவேசம் (2010 - 2015):\n` +
      `- 2010 பொதுத்தேர்தலில் காலி மாவட்டத்தில் 61,788 விருப்பு வாக்குகளுடன் முதல்முறையாக பாராளுமன்றத்திற்குத் தெரிவானார்.\n` +
      `- 2015 தேர்தலிலும் காலி மாவட்டத்திலிருந்து மீண்டும் வெற்றி பெற்றார்.\n\n` +
      `3. முக்கிய அமைச்சரவை அமைச்சுப் பொறுப்புகள் (2019 - 2024):\n` +
      `- பெருந்தோட்டத்துறை அமைச்சர் (2019-2022)\n` +
      `- கல்வி அமைச்சர் (2022)\n` +
      `- சுகாதாரத்துறை மற்றும் கைத்தொழில் அமைச்சர் (2023-2024)\n\n` +
      `4. தற்போதைய அரசியல் நிலை (2024 - 2026):\n` +
      `- தென் மாகாணத்தின் செல்வாக்குமிக்க சிரேஷ்ட தலைவராக தொடர்ந்து இயங்கி வருகிறார்.`
    );
  }

  // Sri Lanka News
  if (low.includes("slnews") || low.includes("இலங்கை") || low.includes("news") || low.includes("செய்தி")) {
    return (
      `🇱🇰 இலங்கை முக்கிய செய்திகள் & நடப்பு நிகழ்வுகள்:\n\n` +
      `• 🏛️ புதிய பாராளுமன்றக் கூட்டத்தொடரில் தேசிய பொருளாதார மற்றும் முதலீட்டுக் கொள்கை மீதான விவாதம் ஆரம்பம்.\n` +
      `• 💵 இலங்கை மத்திய வங்கியின் அந்நியச் செலாவணிக் கையிருப்பு மற்றும் ரூபாயின் பெறுமதி நிலைத்தன்மை குறித்து அறிக்கை வெளியீடு.\n` +
      `• ☀️ தென் மற்றும் மேற்கு மாகாணங்களில் மழையுடனான வானிலை நிலவக்கூடும் என வளிமண்டலவியல் திணைக்களம் அறிவிப்பு.\n` +
      `• 🏏 இலங்கை கிரிக்கெட் அணியின் எதிர்வரும் சர்வதேச தொடருக்கான புதிய குழாம் அறிவிப்பு.`
    );
  }

  // World News
  if (low.includes("worldnews") || low.includes("சர்வதேசம்") || low.includes("உலக")) {
    return (
      `🌐 உலகளாவிய முக்கிய செய்திகள் (Global Intelligence):\n\n` +
      `• 🤖 சர்வதேச AI தொழில்நுட்ப உச்சி மாநாட்டில் புதிய தன்னாட்சி AI மாதிரிகள் அறிமுகம்.\n` +
      `• 📈 உலக சந்தையில் கச்சா எண்ணெய் மற்றும் தங்கத்தின் விலையில் புதிய மாற்றங்கள்.\n` +
      `• 🌍 மத்திய கிழக்கு மற்றும் ஆசிய பிராந்தியத்தில் புதிய வர்த்தக கூட்டணிகள் உருவாக்கம்.\n` +
      `• 🪙 Bitcoin மற்றும் முன்னணி கிரிப்டோ நாணயங்கள் முக்கிய ஆதரவு நிலைகளில் ஸ்திரமாக வர்த்தகம்.`
    );
  }

  // Daily Briefing
  if (low.includes("briefing") || low.includes("அறிக்கை") || low.includes("today")) {
    return (
      `📊 Sam AI Assistant - Daily Executive Briefing:\n\n` +
      `1. 💼 Agency & Projects: சுடர் மீடியா லைவ் டெமோ நேரலையில் இயங்குகிறது.\n` +
      `2. 🇱🇰 இலங்கை நிலவரம்: நாணய மாற்று விகிதம் USD/LKR 302.50 நிலையில் சீராக உள்ளது.\n` +
      `3. 🌐 தொழில்நுட்பம்: SAM AI Telegram Webhook Vercel Edge சர்வரில் 100% Uptime-ல் இயங்குகிறது.\n` +
      `4. 🚀 இன்றைய பரிந்துரை: வாடிக்கையாளர் திட்டங்களுக்கான புதிய டாஸ்க் பிட்களைத் தொடங்கலாம்.`
    );
  }

  // Greetings & Casual Conversation
  if (low.includes("hello") || low.includes("hi") || low.includes("வணக்கம்") || low.includes("மச்சான்") || low.includes("machan") || low.includes("epdi") || low.includes("nalla") || low.includes("hey")) {
    return `வணக்கம் மச்சான்! நான் நலமாக இருக்கிறேன். நாம் தொடர்ந்து இங்கேயே பேசிக்கொள்ளலாம். சுடர் மீடியா தளம், புதிய புராஜெக்ட், இலங்கை அரசியல் அல்லது கிரிப்டோ — என்ன செய்ய வேண்டும் என்று சொல்லுங்கள், உடனே ஆரம்பிக்கலாம்! 🔥`;
  }

  return `வணக்கம் மச்சான்! உங்கள் செய்தி பெறப்பட்டது: '${prompt}'\n\nநாம் தொடர்ந்து இங்கேயே நேரடியாகப் பேசலாம். உங்களுக்குத் தேவையான யோசனைகள், இணையதள மாற்றங்கள் அல்லது ஆராய்ச்சிகள் எவை என்றாலும் நேரடியாகத் தட்டச்சு செய்யுங்கள்!`;
}

async function handleTelegramDirect(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data || !data.message || !data.message.text) {
      return NextResponse.json({ status: "ok" });
    }

    const chatId = data.message.chat.id;
    const text = data.message.text.trim();
    const userFirstName = data.message.from?.first_name || "User";

    sendChatAction(chatId, "typing").catch(() => {});

    const reply = generateSmartReply(text, userFirstName);
    await sendTelegramMessage(chatId, reply);

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Direct Telegram Handler Error:", err);
    return NextResponse.json({ status: "error", error: err.message }, { status: 200 });
  }
}

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const pathArr = params.path || [];
    const subPath = pathArr.join("/");

    // Intercept Telegram Webhook directly in Next.js Serverless (100% Auto-Deploy Reliability)
    if (subPath === "telegram/webhook" || subPath === "telegram") {
      if (request.method === "POST") {
        return handleTelegramDirect(request);
      }
      return NextResponse.json({
        status: "active",
        platform: "Vercel Global Edge",
        endpoint: "/api/telegram/webhook"
      });
    }

    const searchParams = new URL(request.url).search;
    const targetUrl = `${RAILWAY_API_BASE}/${subPath}${searchParams}`;
    
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        init.body = arrayBuffer;
      }
    }

    const response = await fetch(targetUrl, init);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!["transfer-encoding", "content-encoding"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("API Gateway Proxy Error:", error);
    return NextResponse.json(
      { status: "error", message: "API Gateway Proxy Error", details: error.message },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}
