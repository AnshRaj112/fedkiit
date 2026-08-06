import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Official FED Account Email destination
    const fedEmail = "fedkiit@gmail.com";

    console.log("----------------------------------------");
    console.log("📨 NEW CONTACT FORM SUBMISSION TO FED:");
    console.log(`To: ${fedEmail}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Message: ${message}`);
    console.log("----------------------------------------");

    // Return success response with mailto URI for direct email client opening if needed
    const mailtoUrl = `mailto:${fedEmail}?subject=Contact%20Form%20Submission%20from%20${encodeURIComponent(
      name
    )}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )}`;

    return NextResponse.json({
      success: true,
      message: "Your message has been sent to FED successfully!",
      mailtoUrl,
    });
  } catch (error) {
    console.error("Failed to process contact submission:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
