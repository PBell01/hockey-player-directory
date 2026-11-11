import { createFileRoute } from '@tanstack/react-router'
import { validateEvaluationPayload } from '../../server/validation/evaluation-payload'
import { csrfBlockResponse } from '../../server/csrf'

// Error envelope from openapi/hockey-ingestion.yaml (ErrorResponse).
function errorResponse(
  status: number,
  code: string,
  message: string,
  details: { field: string; code: string; message: string }[] = [],
) {
  return Response.json({ error: { code, message, details } }, { status })
}

export const Route = createFileRoute('/api/evaluations')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const blocked = csrfBlockResponse(request)
        if (blocked) return blocked

        const contentType = request.headers.get('content-type') ?? ''
        if (!contentType.toLowerCase().includes('application/json')) {
          return errorResponse(
            400,
            'MALFORMED_REQUEST',
            'Content-Type must be application/json.',
          )
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return errorResponse(
            400,
            'MALFORMED_REQUEST',
            'Request body is empty or is not valid JSON.',
          )
        }

        const result = validateEvaluationPayload(body)
        if (!result.ok) {
          return errorResponse(
            422,
            'VALIDATION_FAILED',
            'The evaluation could not be saved because one or more fields are invalid.',
            result.errors,
          )
        }

        // Stub success: no database, no auth in this step.
        return Response.json(
          { id: crypto.randomUUID(), state: 'submitted', ...result.data },
          { status: 201 },
        )
      },
    },
  },
})