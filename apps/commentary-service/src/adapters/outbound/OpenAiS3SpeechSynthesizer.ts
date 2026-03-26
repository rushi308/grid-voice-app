import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  CommentaryAudioAsset,
  CommentaryAudioSynthesizerPort,
  WsCommentaryRequest,
} from "@grid-voice/types";

const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE = "alloy";
const DEFAULT_URL_TTL_SECONDS = 900;

export class OpenAiS3SpeechSynthesizer implements CommentaryAudioSynthesizerPort {
  private readonly openai: OpenAI;
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly ttsModel: string;
  private readonly ttsVoice: string;
  private readonly urlTtlSeconds: number;

  constructor(options: {
    apiKey: string;
    bucketName: string;
    region: string;
    ttsModel?: string;
    ttsVoice?: string;
    urlTtlSeconds?: number;
  }) {
    this.openai = new OpenAI({ apiKey: options.apiKey });
    this.s3Client = new S3Client({ region: options.region });
    this.bucketName = options.bucketName;
    this.ttsModel = options.ttsModel ?? DEFAULT_TTS_MODEL;
    this.ttsVoice = options.ttsVoice ?? DEFAULT_TTS_VOICE;
    this.urlTtlSeconds = options.urlTtlSeconds ?? DEFAULT_URL_TTL_SECONDS;
  }

  async synthesizeAndStore(
    input: WsCommentaryRequest,
    commentaryText: string,
  ): Promise<CommentaryAudioAsset> {
    const speech = await this.openai.audio.speech.create({
      model: this.ttsModel,
      voice: this.ttsVoice,
      input: commentaryText,
      response_format: "mp3",
    });

    const audioBytes = Buffer.from(await speech.arrayBuffer());
    const objectKey = this.buildObjectKey(input);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: audioBytes,
        ContentType: "audio/mpeg",
        CacheControl: "private, max-age=0, no-cache",
      }),
    );

    const audioUrl = await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      }),
      {
        expiresIn: this.urlTtlSeconds,
      },
    );

    return {
      audioUrl,
      audioContentType: "audio/mpeg",
      audioExpiresAt: new Date(
        Date.now() + this.urlTtlSeconds * 1000,
      ).toISOString(),
    };
  }

  private buildObjectKey(input: WsCommentaryRequest): string {
    const safeDriver = input.driver.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `commentary/${input.season}/${input.round}/${safeDriver}-${Date.now()}-${randomUUID()}.mp3`;
  }
}
