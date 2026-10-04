// src/content/posts/lgpd-e-prospeccao-de-leads.ts
import type { BlogPost } from '@/content/types'

export const POST: BlogPost = {
  slug: 'lgpd-e-prospeccao-de-leads',
  title: 'LGPD e prospecção de leads: o que sua empresa precisa saber',
  description:
    'LGPD e prospecção B2B: o que diz a lei sobre dados públicos de empresas, base legal, listas prontas e um checklist de conformidade em 8 itens.',
  keywords: [
    'lgpd prospecção',
    'leads lgpd',
    'dados públicos lgpd',
    'marketing direto lgpd',
    'base legal prospecção b2b',
  ],
  category: 'Legal & privacidade',
  tags: ['lgpd', 'prospecção b2b', 'dados públicos', 'marketing direto', 'base legal'],
  authorId: 'rafael-nogueira',
  datePublished: '2026-08-22T09:00:00-03:00',
  dateModified: '2026-10-01T09:00:00-03:00',
  readingMinutes: 8,
  blocks: [
    {
      type: 'takeaways',
      items: [
        'Dados comerciais de empresas (CNPJ, telefone comercial, site) têm regime mais leve que dados pessoais — mas não é atalho para descuido.',
        'Dado público não dispensa base legal: legitimidade, finalidade e minimização seguem exigidas quando há dado pessoal.',
        'A fronteira é a pessoa física: autônomo, MEI e profissional liberal pedem o mesmo cuidado do B2C.',
        'Listas prontas de origem desconhecida transferem para você o risco de quem coletou.',
        'Opt-out claro, cadência razoável e registro de exclusão sustentam uma operação B2B defensável.',
      ],
    },
    {
      type: 'bluf',
      text:
        'A LGPD protege pessoas naturais, não pessoas jurídicas: CNPJ, telefone comercial e e-mail institucional da empresa, em regra, não são dados pessoais. Mas dado público não dispensa cuidado — quando o contato identifica uma pessoa física (autônomo, MEI), a lei se aplica por inteiro, com base legal, finalidade clara e caminho fácil de exclusão.',
    },
    {
      type: 'p',
      text:
        'Prospecção B2B no Brasil opera em zona mais tranquila que B2C, e a razão é conceitual: CNPJ, telefone da loja e contato@empresa.com.br tratam da organização, não do indivíduo. O risco aparece quando o dado identifica a pessoa por trás do negócio — o celular pessoal do dono de um MEI, por exemplo.',
    },
    { type: 'h2', text: 'O que a LGPD diz sobre dados de empresas?' },
    {
      type: 'p',
      text:
        'A LGPD (Lei 13.709/2018) define dado pessoal como informação relacionada a pessoa natural identificável. **Pessoa jurídica não é titular no sentido da lei**: razão social, CNPJ, telefone comercial e endereço empresarial não são, em regra, dados pessoais. Montar uma lista de negócios com nome da empresa, telefone comercial e site, portanto, não é por si só tratamento de dados pessoais.',
    },
    {
      type: 'p',
      text:
        'A fronteira é o indivíduo. Autônomo, MEI e clínica cujo contato é o celular pessoal do dono misturam figura comercial e pessoa física — nesses casos, a LGPD se aplica normalmente. A decisão operacional é simples: havendo dúvida sobre quem responde do outro lado, trate como dado pessoal.',
    },
    { type: 'h2', text: 'Dados públicos dispensam cuidado legal?' },
    {
      type: 'p',
      text:
        'Não — e essa é a resposta honesta que boa parte do mercado evita dar. Publicidade não apaga a lei: se o dado é pessoal, o fato de estar publicado no site da empresa não cria base legal. Você ainda precisa de legitimidade para tratar, finalidade específica e respeito aos direitos do titular, inclusive o de pedir exclusão. O que o dado público muda é a expectativa: contatar um telefone comercial publicado é compatível com a finalidade esperada; revendê-lo a terceiros não é.',
    },
    { type: 'h3', text: 'Quais dados o Play Hot Leads coleta' },
    {
      type: 'p',
      text:
        'A plataforma foi desenhada para operar nessa fronteira: coleta somente dados comerciais públicos de negócios. Nada de CPF, dados de consumo, opinião, religião, saúde ou qualquer dado pessoal sensível.',
    },
    {
      type: 'ul',
      items: [
        'Nome da empresa e endereço comercial, vindos de fontes públicas de negócios (mapas e diretórios).',
        'Telefone comercial normalizado em E.164 e validado por país.',
        'Site, e-mail institucional e redes comerciais, extraídos do site público da própria empresa.',
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Conteúdo educativo',
      text:
        'Este artigo é conteúdo educativo, não aconselhamento jurídico. A aplicação da LGPD depende do contexto do seu negócio, do canal de contato e da interpretação da ANPD e dos tribunais. Antes de estruturar sua operação de prospecção, valide o fluxo com um advogado especializado em proteção de dados.',
    },
    { type: 'h2', text: 'Checklist de conformidade para prospecção B2B' },
    {
      type: 'p',
      text:
        'Oito itens separam uma operação defensável de uma operação frágil. Nenhum exige advogado para começar — exige processo:',
    },
    {
      type: 'ol',
      items: [
        'Identifique a base legal de cada canal e escreva em uma frase — legítimo interesse é a base típica da prospecção B2B com dados comerciais.',
        'Ofereça opt-out claro em toda mensagem: um caminho simples para pedir que o contato não seja mais abordado.',
        'Registre consentimento quando o canal exigir — contato direto a pessoa natural pede mais rigor que contato comercial empresarial.',
        'Mantenha cadência razoável: número de tentativas e intervalo definidos, sem disparo infinito.',
        'Atenda exclusões em todas as campanhas: quem pediu para sair não volta à lista, em nenhuma ferramenta.',
        'Aplique minimização: colete só o que a finalidade usa — telefone e e-mail comercial bastam para o primeiro contato.',
        'Proteja a base: acesso por conta individual, dados isolados por tenant e nada de planilha circulando no grupo.',
        'Revise o processo periodicamente: fontes, textos de mensagem, registro de exclusões e a evolução da regulação.',
      ],
    },
    { type: 'h2', text: 'Como prospectar com menos risco a partir de hoje?' },
    {
      type: 'p',
      text:
        'Construa a própria base a partir de fontes públicas comerciais e mantenha o registro de exclusão desde o primeiro dia. No Play Hot Leads, a busca por nicho + cidade coleta só dados comerciais públicos, com dedup automático — e, como a lista é sua, você sabe a origem de cada contato e como ele foi coletado.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Posso comprar lista de leads pronta?',
          a:
            'Pode, mas entenda o que compra. Lista de origem desconhecida herda os problemas de quem coletou: você não sabe a fonte, se o titular autorizou nem quantas vezes o contato já foi bombardeado. Há risco legal quando existe dado pessoal, a taxa de resposta cai e o domínio remetente queima. Construir a própria base é mais devagar no primeiro dia e mais barato no longo prazo.',
        },
        {
          q: 'Dados públicos de empresas são dados pessoais?',
          a:
            'Em regra, não — CNPJ, razão social e contatos comerciais pertencem à pessoa jurídica, que não é titular pela LGPD. A exceção é o contato que identifica pessoa natural: autônomo, MEI com celular pessoal, profissional liberal. Nesses casos, trate como dado pessoal, com base legal e atenção aos direitos do titular.',
        },
        {
          q: 'Qual é a base legal correta para prospecção B2B?',
          a:
            'Depende do canal e do dado. Para contato a dados de pessoa jurídica, a discussão nem é central, porque não há dado pessoal envolvido. Quando há dado pessoal, o legítimo interesse costuma ser invocado na prospecção B2B — e deve ser documentado por escrito, não presumido.',
        },
        {
          q: 'O que fazer quando alguém pede para remover os dados?',
          a:
            'Remover na hora e registrar a exclusão. O pedido vale para a campanha atual e para as próximas: a pessoa sai da lista de disparo e não volta em busca futura. Responder rápido custa um minuto; ignorar custa uma reclamação à ANPD.',
        },
      ],
    },
    {
      type: 'summary',
      items: [
        'Pessoa jurídica não é titular pela LGPD: dados comerciais da empresa têm regime mais leve, com fronteiras claras.',
        'Dado público não dispensa cuidado: base legal, finalidade e direitos do titular seguem valendo quando há dado pessoal.',
        'Colete dados comerciais públicos, minimize, documente e mantenha opt-out funcionando em todo canal.',
        'Listas prontas de origem desconhecida transferem risco para quem compra — a base própria é o caminho defensável.',
      ],
    },
    {
      type: 'links',
      title: 'Leia em seguida',
      items: [
        {
          label: 'Fontes de dados para encontrar leads locais',
          href: '/blog/fontes-de-dados-para-encontrar-leads-locais',
          description: 'As fontes públicas que alimentam uma base própria e rastreável.',
        },
        {
          label: 'Prospecção por nicho e localização',
          href: '/blog/prospeccao-por-nicho-e-localizacao',
          description: 'Método de prospecção ativa segmentada por nicho e cidade.',
        },
        {
          label: 'O que é lead geração',
          href: '/blog/o-que-e-lead-generacao',
          description: 'Conceitos de base, inclusive a diferença entre inbound e prospecção.',
        },
        {
          label: 'Kanban de vendas',
          href: '/blog/kanban-de-vendas-como-organizar-leads',
          description: 'Organize cadência e estágio de cada contato com disciplina.',
        },
        {
          label: 'Perguntas frequentes',
          href: '/faq',
          description: 'Dúvidas sobre dados, fontes e funcionamento da plataforma.',
        },
        {
          label: 'Fale com o time',
          href: '/contato',
          description: 'Dúvida específica sobre o fluxo de dados do Play Hot Leads?',
        },
      ],
    },
  ],
  related: [
    'fontes-de-dados-para-encontrar-leads-locais',
    'kanban-de-vendas-como-organizar-leads',
    'prospeccao-por-nicho-e-localizacao',
    'o-que-e-lead-generacao',
    'como-encontrar-leads-no-whatsapp',
  ],
}
