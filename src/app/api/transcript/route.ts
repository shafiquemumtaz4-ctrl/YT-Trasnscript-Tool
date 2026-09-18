import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "edge";

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

    // Use a custom fetch to override the hardcoded, outdated User-Agent in youtube-transcript
    // This helps prevent YouTube from blocking the request on Vercel.
    const customFetch = (fetchUrl: RequestInfo | URL, options?: RequestInit) => {
      if (options && options.headers) {
        (options.headers as Record<string, string>)['User-Agent'] = 
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
      }
      return fetch(fetchUrl, options);
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
  } catch (error: any) {
    console.error("Error fetching transcript:", error);
    
    let errorMessage = "Failed to fetch transcript. The video might not have captions enabled or is private.";
    
    if (error.message) {
      if (error.message.includes("Could not find captions")) {
        errorMessage = "Captions are disabled or unavailable for this video.";
      } else if (error.message.includes("Video unavailable")) {
        errorMessage = "The video is unavailable or private.";
      } else if (error.message.includes("Too many request")) {
         errorMessage = "YouTube is temporarily blocking requests from our server. Please try again later.";
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
