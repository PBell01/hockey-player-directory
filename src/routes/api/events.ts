import { createFileRoute } from '@tanstack/react-router'
import { getSupabaseServerClient } from '../../../app/lib/supabase.server'
import { validateEventPayload } from '../../server/validation/event-payload'

// Error envelope from openapi/hockey-ingestion.yaml (ErrorResponse).
function errorResponse(
  status: number,
  code: string,
  message: string,
  details: { field: string; code: string; message: string }[] = [],
) {
  return Response.json({ error: { code, message, details } }, { status })
}

export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
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

        const result = validateEventPayload(body)
        if (!result.ok) {
          return errorResponse(
            422,
            'VALIDATION_FAILED',
            'The event could not be accepted because one or more fields are invalid.',
            result.errors,
          )
        }

        const client = getSupabaseServerClient()
        const { data: existing, error: lookupError } = await client
          .from('provider_events')
          .select('id, provider_event_id, event')
          .eq('provider_event_id', result.data.providerEventId)
          .maybeSingle()

        if (lookupError) {
          return errorResponse(
            500,
            'INTERNAL',
            'The event could not be saved.',
          )
        }

        if (existing) {
          const isExactReplay =
            JSON.stringify(existing.event) === JSON.stringify(result.data)

          if (isExactReplay) {
            return Response.json(
              {
                id: existing.id,
                state: 'accepted',
                event: existing.event,
                replayed: true,
              },
              { status: 201 },
            )
          }

          const { data: corrected, error: correctionError } = await client
            .from('provider_events')
            .update({ event: result.data, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select('id, event')
            .single()

          if (correctionError) {
            return errorResponse(
              500,
              'INTERNAL',
              'The event could not be saved.',
            )
          }

          return Response.json(
            {
              id: corrected.id,
              state: 'accepted',
              event: corrected.event,
              corrected: true,
            },
            { status: 201 },
          )
        }

        const { data: stored, error: insertError } = await client
          .from('provider_events')
          .insert({
            provider_event_id: result.data.providerEventId,
            event: result.data,
          })
          .select('id, event')
          .single()

        if (insertError) {
          return errorResponse(
            500,
            'INTERNAL',
            'The event could not be saved.',
          )
        }

        return Response.json(
          { id: stored.id, state: 'accepted', event: stored.event },
          { status: 201 },
        )
      },
    },
  },
})