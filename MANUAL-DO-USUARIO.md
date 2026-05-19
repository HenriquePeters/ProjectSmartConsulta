# Manual do Usuário

## 1. Visão geral

Este manual explica como usar a aplicação Smart Consulta nos ambientes publicados.

## 2. Acessando a aplicação

1. Abra o navegador.
2. Acesse uma das URLs:
   - Ambiente DEV/HML: `https://smart-consulta-dev-hp-20260407.web.app`
   - Ambiente PRD: `https://smart-consulta-prd-hp-260407.web.app`

## 3. Login e registro

### Login
1. Clique em **Entrar**.
2. Informe o e-mail e a senha.
3. Clique em **Entrar**.

### Registro
1. Clique em **Criar conta**.
2. Preencha os dados solicitados.
3. Clique em **Registrar**.

> Usuário de demonstração:
> - Email: `joao@example.com`
> - Senha: `senha123`

## 4. Agendar uma consulta

1. Após o login, navegue até a lista de clínicas.
2. Use filtros para escolher especialidade ou cidade.
3. Clique na clínica desejada.
4. Selecione um médico e uma data disponível.
5. Escolha o horário e confirme o agendamento.

## 5. Visualizar agendamentos

1. Acesse o menu de agendamentos.
2. Veja o histórico de consultas.
3. Consulte detalhes ou status de cada atendimento.

## 6. Cancelar um agendamento

1. No histórico de agendamentos, localize a consulta.
2. Clique em **Cancelar**.
3. Confirme o cancelamento.

## 7. Avaliar uma clínica

1. Acesse a página de detalhes da clínica.
2. Role até a seção de avaliações.
3. Informe a nota e o comentário.
4. Envie a avaliação.

## 8. Recuperar senha

1. Clique em **Esqueci minha senha**.
2. Informe o e-mail cadastrado.
3. Siga as instruções recebidas por e-mail.

## 9. Observações importantes

- O frontend depende da API configurada por `DEV_API_URL` ou `PRD_API_URL`.
- Caso a aplicação não carregue dados, verifique se o backend está disponível.
- Não utilize dados reais sensíveis durante a demonstração.

## 10. Limitações conhecidas

- O Firebase Hosting publica apenas o frontend estático.
- O backend deve estar ativo em outra plataforma para a aplicação funcionar corretamente.
- Caso o backend não esteja disponível, as funcionalidades de agendamento e autenticação não funcionarão.
