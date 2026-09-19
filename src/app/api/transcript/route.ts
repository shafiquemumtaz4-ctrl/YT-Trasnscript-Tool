import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const dynamic = "force-dynamic";

import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Use environment variable for the proxy URL to keep credentials secure!
// On Vercel, go to Settings -> Environment Variables and add PROXY_URL:
// http://ptaaxfit:8dgds2w1dwhy@31.59.20.176:6754
const proxyUrl = process.env.PROXY_URL || "http://ptaaxfit:8dgds2w1dwhy@31.59.20.176:6754";
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required." },
        { status: 400 }
      );
    }

    const customFetch = (fetchUrl: RequestInfo | URL, options?: RequestInit) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newOptions: RequestInit & { agent?: any } = { ...options };
      newOptions.headers = {
        ...newOptions.headers,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'CONSENT=YES+cb; SOCS=CAI;'
      };
      
      // Attach the proxy agent
      if (agent) {
        newOptions.agent = agent;
      }
      
      return fetch(fetchUrl, newOptions);
    };

    // Try fetching the transcript
    const transcript = await YoutubeTranscript.fetchTranscript(url, { fetch: customFetch });

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "No transcript found for this video." },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcript }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transcript:", error);
    
    let errorMessage = "Failed to fetch transcript. The video might not have captions enabled or is private.";
    let debugMessage = "Unknown error";
    let debugStack = "";
    
    if (error instanceof Error) {
      debugMessage = error.message;
      debugStack = error.stack || "";
      if (error.message.includes("Could not find captions")) {
        errorMessage = "Captions are disabled or unavailable for this video.";
      } else if (error.message.includes("Video unavailable")) {
        errorMessage = "The video is unavailable or private.";
      } else if (error.message.includes("Too many request")) {
         errorMessage = "YouTube is temporarily blocking requests from our server. Please try again later.";
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        debug_message: debugMessage,
        debug_stack: debugStack
      },
      { status: 500 }
    );
  }
}
