/**
 * RSVP Manager - Data Model
 * 
 * Este arquivo define a estrutura de dados central do sistema.
 * Segue uma arquitetura relacional simulada, focada em RSVP de Lista Fechada.
 */

// ==========================================
// ENUMS & TYPES
// ==========================================

export type RSVPStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export type UserRole = 'ADMIN' | 'ORGANIZER';

export type EventType = 'WEDDING' | 'DEBUTANTE' | 'CORPORATE' | 'BIRTHDAY' | 'OTHER';

// ==========================================
// ENTIDADES PRINCIPAIS
// ==========================================

/**
 * USER (Admin ou Organizador)
 * Representa quem acessa o sistema para gerenciar eventos.
 */
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
}

/**
 * EVENT (O Evento)
 * O coração do SaaS. Pertence a um Organizador.
 * Um organizador pode, futuramente, ter múltiplos eventos, mas no MVP focamos em 1:1.
 */
export interface Event {
    id: string;
    organizerId: string; // FK -> User.id
    name: string;        // Ex: "Casamento Luana & Pedro"
    slug: string;        // URL amigável única. Ex: "luana-e-pedro-2026"
    date: Date;
    location: string;
    type: EventType;

    // Configurações de RSVP
    rsvpLimitDate?: Date; // Data limite para confirmar
    maxCompanionsPerInvite: number; // Trava de segurança padrão (ex: max 5 por convite)

    // Customização Visual (Simples)
    themeColor?: string; // Ex: #C6A664
    coverImage?: string;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * INVITE (O Convite "Físico" Virtual)
 * Representa um "código de convite" ou uma família/grupo.
 * É a entidade que agrupa as pessoas.
 * O RSVP é feito POR CONVITE, não necessariamente por pessoa individualmente no primeiro momento.
 * Ex: "Família Silva" é um Invite que contém 4 Persons.
 */
export interface Invite {
    id: string;
    eventId: string; // FK -> Event.id
    code: string;    // Código único de acesso (ex: "ABC-123") para evitar penetras
    // Pode ser usado na URL ou digitado pelo convidado

    name: string;    // Nome descritivo do convite (ex: "Família Silva" ou "Roberto e Esposa")

    maxGuestsAllowed: number; // LIMITE DE PAX para este convite específico (Regra de Lista Fechada)
    // Ex: Família tem 4 pessoas, mas convite permite até 5.

    status: RSVPStatus; // Status geral do convite (se alguém confirmou, vira CONFIRMED)

    updatedAt: Date;
}

/**
 * PERSON (Pessoas/Pax)
 * Indivíduos reais que irão ao evento.
 * No modelo de lista fechada, geralmente importamos os nomes principais,
 * e o convidado preenche os nomes dos acompanhantes.
 */
export interface Person {
    id: string;
    inviteId: string; // FK -> Invite.id

    name: string;     // Nome completo
    isMainGuest: boolean; // Se é o titular do convite (quem recebeu o link)

    status: RSVPStatus;   // Confirmação individual (ex: Pai vai, Filho não vai)
    dietaryRestrictions?: string; // Restrições alimentares (Opcional)
    ageGroup?: 'ADULT' | 'CHILD' | 'BABY'; // Útil para buffet
}

// ==========================================
// REGRAS DE NEGÓCIO IMPORTANTE
// ==========================================

/*
1. LISTA FECHADA & SEGURANÇA
   - Um convidado não pode se auto-convidar.
   - Ele deve possuir um `code` (Link) válido que aponta para um `Invite` existente.
   - O sistema valida: (Número de Persons confirmadas) <= (Invite.maxGuestsAllowed).

2. FLUXO DE CONFIRMAÇÃO
   - O usuário acessa /convite/[slug]
   - Digita seu nome ou código.
   - O sistema carrega o `Invite`.
   - O usuário lista os nomes das `Person`s (Acompanhantes).
   - O sistema salva desde que não exceda `maxGuestsAllowed`.

3. RELACIONAMENTOS
   - User (1) -> (N) Event
   - Event (1) -> (N) Invite
   - Invite (1) -> (N) Person
*/
