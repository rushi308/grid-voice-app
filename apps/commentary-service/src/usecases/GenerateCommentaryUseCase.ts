import type {
  CommentaryGeneratorPort,
  WsCommentaryRequest,
  WsCommentaryResponse,
} from "@grid-voice/types";

export class GenerateCommentaryUseCase {
  constructor(private readonly commentaryGenerator: CommentaryGeneratorPort) {}

  async execute(request: WsCommentaryRequest): Promise<WsCommentaryResponse> {
    return this.commentaryGenerator.generate(request);
  }
}
