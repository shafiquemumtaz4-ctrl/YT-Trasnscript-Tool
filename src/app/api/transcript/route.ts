import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

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

    // Try fetching the transcript
    const transcript = await YoutubeTranscript.fetchTranscript(url);

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
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
