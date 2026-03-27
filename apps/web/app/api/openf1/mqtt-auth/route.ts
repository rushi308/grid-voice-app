import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const username = process.env.MQT_USERNAME ?? process.env.MQTT_USERNAME;
  const token = process.env.MQTT_TOKEN;

  if (!username || !token) {
    return NextResponse.json(
      {
        error:
          "Missing MQT_USERNAME/MQTT_USERNAME or MQTT_TOKEN environment variables.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { username, token },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
