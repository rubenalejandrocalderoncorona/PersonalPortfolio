import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? 'rubenalejandrocalderoncorona@gmail.com'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  console.log('POST /api/contact — start')

  let body: { name?: string; email?: string; company?: string; message?: string; honeypot?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { name, email, company, message, honeypot } = body

  // Honeypot: real users never fill this hidden field — bots often do
  if (honeypot) {
    console.log('POST /api/contact — honeypot triggered, silently dropping')
    return NextResponse.json({ ok: true })
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (message.trim().length > 5000) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: TO_EMAIL,
      replyTo: email.trim(),
      subject: `New portfolio inquiry from ${name.trim()}`,
      text: [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        company?.trim() ? `Company: ${company.trim()}` : null,
        '',
        message.trim(),
      ].filter(Boolean).join('\n'),
    })

    if (error) {
      console.log('POST /api/contact — Resend error:', error)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 502 })
    }
  } catch (err) {
    console.log('POST /api/contact — exception:', err)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  console.log('POST /api/contact — sent successfully')
  return NextResponse.json({ ok: true })
}
