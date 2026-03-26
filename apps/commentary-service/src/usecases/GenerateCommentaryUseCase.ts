import type {
  CommentaryAudioSynthesizerPort,
  CommentaryTextGeneratorPort,
  WsCommentaryRequest,
  WsCommentaryResponse,
} from "@grid-voice/types";

export class GenerateCommentaryUseCase {
  constructor(
    private readonly textGenerator: CommentaryTextGeneratorPort,
    private readonly audioSynthesizer: CommentaryAudioSynthesizerPort,
  ) {}

  async execute(request: WsCommentaryRequest): Promise<WsCommentaryResponse> {
    const message = await this.textGenerator.generateText(request);
    const audioAsset = await this.audioSynthesizer.synthesizeAndStore(
      request,
      message,
    );

    return {
      message,
      generatedAt: new Date().toISOString(),
      audioUrl: audioAsset.audioUrl,
      audioContentType: audioAsset.audioContentType,
      audioExpiresAt: audioAsset.audioExpiresAt,
    };
  }
}
