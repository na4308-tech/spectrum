import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (path) {
      case 'sessions':
        return await handleSessions(req, supabaseClient)
      case 'messages':
        return await handleMessages(req, supabaseClient)
      case 'create-session':
        return await handleCreateSession(req, supabaseClient)
      case 'add-message':
        return await handleAddMessage(req, supabaseClient)
      case 'update-title':
        return await handleUpdateTitle(req, supabaseClient)
      case 'delete-session':
        return await handleDeleteSession(req, supabaseClient)
      case 'stats':
        return await handleStats(req, supabaseClient)
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// 채팅 세션 목록 조회
async function handleSessions(req: Request, supabase: any) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const { data, error } = await supabase
    .rpc('get_user_chat_sessions', { p_limit: limit, p_offset: offset })

  if (error) throw error

  return new Response(
    JSON.stringify({ sessions: data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// 채팅 메시지 조회
async function handleMessages(req: Request, supabase: any) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session_id')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Session ID is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabase
    .rpc('get_chat_messages', { 
      p_session_id: sessionId, 
      p_limit: limit, 
      p_offset: offset 
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ messages: data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// 새 채팅 세션 생성
async function handleCreateSession(req: Request, supabase: any) {
  const body = await req.json()
  const { title = '새로운 채팅', model = 'gpt-3.5-turbo' } = body

  const { data, error } = await supabase
    .rpc('create_chat_session', { p_title: title, p_model: model })

  if (error) throw error

  return new Response(
    JSON.stringify({ session_id: data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// 메시지 추가
async function handleAddMessage(req: Request, supabase: any) {
  const body = await req.json()
  const { 
    session_id, 
    role, 
    content, 
    tokens_used = 0, 
    metadata = {} 
  } = body

  if (!session_id || !role || !content) {
    return new Response(
      JSON.stringify({ error: 'Session ID, role, and content are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabase
    .rpc('add_chat_message', {
      p_session_id: session_id,
      p_role: role,
      p_content: content,
      p_tokens_used: tokens_used,
      p_metadata: metadata
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ message_id: data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// 세션 제목 업데이트
async function handleUpdateTitle(req: Request, supabase: any) {
  const body = await req.json()
  const { session_id, title } = body

  if (!session_id || !title) {
    return new Response(
      JSON.stringify({ error: 'Session ID and title are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabase
    .rpc('update_chat_session_title', {
      p_session_id: session_id,
      p_title: title
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// 세션 삭제
async function handleDeleteSession(req: Request, supabase: any) {
  const body = await req.json()
  const { session_id } = body

  if (!session_id) {
    return new Response(
      JSON.stringify({ error: 'Session ID is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabase
    .rpc('delete_chat_session', {
      p_session_id: session_id
    })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// 사용자 통계 조회
async function handleStats(req: Request, supabase: any) {
  const { data, error } = await supabase
    .rpc('get_user_chat_stats')

  if (error) throw error

  return new Response(
    JSON.stringify({ stats: data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}
