import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Função para parsear data ISO sem problemas de timezone
function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Criar transportador SMTP com Outlook/Hotmail
const createTransporter = () => {
    const port = Number(process.env.SMTP_PORT)
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465, // SSL/TLS para porta 465, false para STARTTLS (587)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, guestName, eventSettings, confirmedCompanions, confirmedNames, confirmedDetails, giftListLinks } = body

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Email inválido' },
                { status: 400 }
            )
        }

        // Formatar data
        const eventDate = parseDateString(eventSettings.eventDate)
        const eventTime = eventSettings.eventTime || '00:00'
        const [hours, minutes] = eventTime.split(':')
        eventDate.setHours(parseInt(hours), parseInt(minutes))
        
        const formattedDate = eventDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

        // Criar URL do Waze (se não houver, usar localização genérica)
        const wazeURL = eventSettings.wazeLocation 
            ? `https://waze.com/ul?q=${encodeURIComponent(eventSettings.wazeLocation)}`
            : `https://waze.com/ul?q=${encodeURIComponent(eventSettings.eventLocation)}`

        // Construir HTML do email com template profissional
        const emailHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'DM Sans', sans-serif;
            background-color: #FAFAF8;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #C6A664 0%, #B8945A 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 300;
            letter-spacing: 1px;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #2E2E2E;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .event-info {
            background-color: #FAFAF8;
            border-left: 4px solid #C6A664;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
        }
        .info-row {
            display: flex;
            margin: 15px 0;
            align-items: flex-start;
        }
        .info-icon {
            width: 24px;
            height: 24px;
            margin-right: 15px;
            color: #C6A664;
            flex-shrink: 0;
        }
        .info-text {
            flex: 1;
        }
        .info-label {
            font-size: 12px;
            color: #6B6B6B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 16px;
            color: #2E2E2E;
            font-weight: 500;
        }
        .cta-button {
            display: inline-block;
            background-color: #C6A664;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            font-size: 14px;
            letter-spacing: 0.5px;
        }
        .cta-button:hover {
            background-color: #B8945A;
        }
        .gift-section {
            background-color: #FAFAF8;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
        }
        .gift-section h3 {
            margin: 0 0 15px 0;
            color: #2E2E2E;
            font-size: 16px;
            font-weight: 600;
        }
        .gift-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .gift-links li {
            margin: 10px 0;
        }
        .gift-links a {
            color: #C6A664;
            text-decoration: none;
            font-weight: 500;
        }
        .gift-links a:hover {
            text-decoration: underline;
        }
        .confirmation-badge {
            background-color: #E8F5E9;
            border-left: 4px solid #4CAF50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #2E7D32;
            font-size: 14px;
        }
        .confirmed-names {
            background-color: #F5F5F5;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            border: 1px solid #E0E0E0;
        }
        .confirmed-names h4 {
            margin: 0 0 12px 0;
            font-size: 13px;
            font-weight: 600;
            color: #2E7D32;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .confirmed-names ul {
            margin: 0;
            padding-left: 20px;
            list-style-type: none;
        }
        .confirmed-names li {
            margin: 6px 0;
            color: #333;
            font-size: 14px;
            position: relative;
            padding-left: 20px;
        }
        .confirmed-names li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4CAF50;
            font-weight: bold;
        }
        .footer {
            background-color: #FAFAF8;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #E6E2DC;
        }
        .footer p {
            margin: 5px 0;
            color: #6B6B6B;
            font-size: 12px;
        }
        .divider {
            height: 1px;
            background-color: #E6E2DC;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${eventSettings.coupleNames}</h1>
            <p>Obrigado pela confirmação de presença</p>
            <p style="margin-top: 15px; font-size: 12px; opacity: 0.85; letter-spacing: 0.5px;">Coordenação: Vanessa Bidinotti - Assessoria e Cerimonial</p>
        </div>

        <div class="content">
            <div class="greeting">
                Olá <strong>${guestName}</strong>!
                <br><br>
                Ficamos muito felizes em confirmar a sua presença em nosso evento! 🎉
                <br><br>
                Coordenado com carinho por <strong>Vanessa Bidinotti - Assessoria e Cerimonial</strong>, este será um evento memorável!
                <br><br>
                Aqui estão todos os detalhes que você precisa saber:
            </div>

            <div class="confirmation-badge">
                ✓ Sua confirmação foi recebida com sucesso para <strong>${confirmedCompanions} pessoa${confirmedCompanions > 1 ? 's' : ''}</strong>
                ${confirmedDetails && confirmedDetails.length > 0 ? `
                <div class="confirmed-names">
                    <h4>Confirmados:</h4>
                    <ul>
                        ${confirmedDetails.map((detail: any) => {
                            const categoryLabel = detail.category === 'adult_paying' ? 'Adulto Pagante' : 
                                                detail.category === 'child_paying' ? 'Criança Pagante' : 
                                                'Criança Não Pagante'
                            return `<li>${detail.name} <span style="font-size: 12px; color: #999;">(${categoryLabel})</span></li>`
                        }).join('')}
                    </ul>
                </div>
                ` : confirmedNames && confirmedNames.length > 0 ? `
                <div class="confirmed-names">
                    <h4>Confirmados:</h4>
                    <ul>
                        ${confirmedNames.map((name: string) => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            </div>

            <div class="event-info">
                <div class="info-row">
                    <div class="info-icon">📅</div>
                    <div class="info-text">
                        <div class="info-label">Data e Hora</div>
                        <div class="info-value">${formattedDate}</div>
                    </div>
                </div>

                <div class="info-row">
                    <div class="info-icon">📍</div>
                    <div class="info-text">
                        <div class="info-label">Local</div>
                        <div class="info-value">${eventSettings.eventLocation}</div>
                        <a href="${wazeURL}" class="cta-button" style="display: inline-block; margin-top: 10px; padding: 10px 20px; font-size: 12px;">
                            Abrir no Waze
                        </a>
                    </div>
                </div>
            </div>

            ${eventSettings.giftListLinks && eventSettings.giftListLinks.length > 0 ? `
            <div class="gift-section">
                <h3>🎁 Listas de Presentes</h3>
                <ul class="gift-links">
                    ${eventSettings.giftListLinks.map((link: any) => `
                        <li><a href="${link.url}" target="_blank">→ ${link.name}</a></li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}

            <p style="color: #6B6B6B; font-size: 14px; line-height: 1.6;">
                ${eventSettings.customMessage}
                <br><br>
                Se tiver dúvidas ou precisar alterar sua confirmação, entre em contato conosco.
            </p>
        </div>

        <div class="footer">
            <p><strong>${eventSettings.coupleNames}</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #C6A664; font-weight: 500;">Coordenação por Vanessa Bidinotti - Assessoria e Cerimonial</p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">Sistema de Confirmação de Presença - RSVP Manager</p>
            <p style="margin-top: 8px; font-size: 10px; color: #999;">© 2026 RSVP Manager. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
        `

        // Enviar email via SMTP Hostinger
        try {
            const transporter = createTransporter()
            
            // Verificar configurações de email
            console.log(`[EMAIL] Usando SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`)
            console.log(`[EMAIL] De: ${process.env.SMTP_FROM_EMAIL}`)
            console.log(`[EMAIL] Para: ${email}`)

            // Enviar email
            const result = await transporter.sendMail({
                from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                subject: `Presença Confirmada - ${eventSettings.coupleNames}`,
                html: emailHTML,
                replyTo: process.env.SMTP_FROM_EMAIL
            })

            console.log(`[EMAIL] ✅ Email enviado com sucesso!`)
            console.log(`[EMAIL] Message ID: ${result.messageId}`)
            console.log(`[EMAIL] Destinatário: ${guestName}`)
            console.log(`[EMAIL] Confirmados: ${confirmedCompanions} pessoa(s)`)

            // Retornar sucesso
            return NextResponse.json(
                { 
                    success: true, 
                    message: 'Email enviado com sucesso',
                    email: email,
                    guestName: guestName,
                    messageId: result.messageId
                },
                { status: 200 }
            )
        } catch (emailError) {
            console.error(`[EMAIL] ❌ Erro ao enviar email:`, emailError)
            throw emailError
        }

    } catch (error) {
        console.error('Erro ao enviar email:', error)
        return NextResponse.json(
            { error: 'Erro ao enviar email' },
            { status: 500 }
        )
    }
}
