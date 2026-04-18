import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;
  code: string;
  expose: boolean;

  constructor(status: number, code: string, message: string, expose = true) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}

export function createErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "服务器暂时无法处理请求，请稍后再试。",
      },
    },
    { status: 500 },
  );
}
