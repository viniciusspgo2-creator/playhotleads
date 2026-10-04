// src/content/faq.ts
// FAQ institucional (FAQPage JSON-LD na página /faq).
// Respostas diretas (BLUF), 2–5 frases, fatos concretos do produto,
// sem estatísticas inventadas. Ordem fixa em 12 perguntas.

import type { FaqItem } from '@/content/types'

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'O que é o Play Hot Leads?',
    a: 'O Play Hot Leads é uma ferramenta de geração de leads B2B: você informa nicho e cidade e recebe uma lista de negócios com telefone, WhatsApp, e-mail e site. A busca roda em paralelo em múltiplas fontes públicas, com deduplicação automática — o mesmo negócio encontrado em duas fontes aparece uma vez só. Os leads caem direto no Kanban de vendas, e as campanhas de WhatsApp partem do mesmo painel.',
  },
  {
    q: 'Como funciona a busca?',
    a: 'Você define nicho e cidade — por exemplo, "dentista em Campinas" — e o sistema consulta várias fontes ao mesmo tempo, exibindo os cards em tempo real conforme cada fonte responde. Os resultados passam por deduplicação automática em camadas (telefone, domínio e nome do negócio) para a lista chegar limpa. Após a busca, o enriquecimento consulta o site de cada empresa para completar e-mail, redes sociais e WhatsApp.',
  },
  {
    q: 'Preciso de cartão de crédito para começar?',
    a: 'Não. O cadastro dá 150 créditos grátis, sem cartão e sem compromisso. Cada crédito equivale a 1 lead único entregue na sua lista, e o dedup automático garante que o mesmo negócio não é cobrado duas vezes. Quando o saldo acabar, você recarrega na aba Planos.',
  },
  {
    q: 'Quais fontes de dados são usadas?',
    a: 'A busca consulta 8 fontes: Google Places, Google Maps, Yelp, Yellow Pages, SerpAPI, Overpass/OpenStreetMap, Nominatim e Photon. O enriquecimento completa os dados pelo crawl do próprio site de cada empresa. As fontes gratuitas (Overpass/OpenStreetMap, Nominatim e Photon) já vêm ligadas por padrão; as que exigem chave própria, como Google Places e SerpAPI, são ativadas nas configurações quando você quiser.',
  },
  {
    q: 'A busca funciona fora do Brasil?',
    a: 'Sim — a busca é global e cobre 8 países. Os telefones são normalizados no padrão internacional E.164 conforme o país da busca, então o número chega pronto para ligar ou enviar mensagem. Os resultados vêm no idioma e no formato do país pesquisado.',
  },
  {
    q: 'Preciso das minhas chaves de API?',
    a: 'Não — nenhuma chave é obrigatória para usar o produto. Se quiser ativar fontes pagas como Google Places e SerpAPI, você cadastra as próprias chaves (modelo BYOK) nas configurações. As chaves são armazenadas cifradas com AES-256-GCM e aparecem mascaradas na interface.',
  },
  {
    q: 'Como o WhatsApp funciona?',
    a: 'Cada lead com número de WhatsApp recebe um link wa.me pronto: um clique abre a conversa direta no seu WhatsApp, sem integração. Para volume, as campanhas enviam mensagens em cadência configurável, com variáveis de personalização (nome, cidade, nicho) e estatísticas de envio. Quando as credenciais da API oficial do WhatsApp Business são configuradas, o disparo passa a ser feito por ela.',
  },
  {
    q: 'Os dados dos meus leads ficam isolados?',
    a: 'Sim. A plataforma é multi-tenant: toda consulta ao banco de dados leva o identificador da sua conta (tenant_id) como filtro, e no PostgreSQL o isolamento é reforçado por Row-Level Security (RLS). Na prática, nenhuma outra conta enxerga os seus leads — nem pela interface, nem pela API.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Pix, Mercado Pago, cartão de crédito e Asaas. Na confirmação do pagamento, os créditos são liberados automaticamente na sua conta, sem depender de suporte. O status de cada pagamento fica no histórico da aba Planos.',
  },
  {
    q: 'Posso cancelar?',
    a: 'Sim — não há fidelidade nem período mínimo: o plano pode ser cancelado a qualquer momento. Os créditos comprados continuam disponíveis na sua conta para uso.',
  },
  {
    q: 'Coletar dados públicos é legal?',
    a: 'Coletamos apenas dados de empresas publicados abertamente em fontes públicas — mapas, diretórios e os próprios sites dos negócios — com rate limit por fonte e cadência responsável no contato. A LGPD pede cuidado com dados pessoais: o produto não trata dados pessoais sensíveis, e a forma de usar a lista (a quem contatar e como) é responsabilidade de quem opera. Em resumo: dados públicos de negócios, uso responsável — sem bases paralelas e sem spam.',
  },
  {
    q: 'Como falo com o suporte?',
    a: 'Escreva para contato@playhotleads.com — o atendimento funciona de segunda a sexta, das 9h às 18h (BRT). Para dúvidas sobre prospecção, o blog e o glossário do site cobrem do básico (o que é um lead) ao operacional (cadência, enriquecimento e ICP).',
  },
]
