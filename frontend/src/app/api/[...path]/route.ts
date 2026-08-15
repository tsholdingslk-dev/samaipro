import { NextRequest, NextResponse } from "next/server";

// Target Railway Backend URL
const RAILWAY_API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://samaipro-production-477a.up.railway.app";

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const pathArr = params.path || [];
    const subPath = pathArr.join("/");
    const searchParams = new URL(request.url).search;
    
    const targetUrl = `${RAILWAY_API_BASE}/${subPath}${searchParams}`;
    
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Forward all safe headers
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
        responseHeaders.set(key, value);
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
