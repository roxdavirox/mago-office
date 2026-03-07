## Tipo de mudança

- [ ] `feat`: nova funcionalidade
- [ ] `fix`: correção de bug
- [ ] `refactor`: refatoração sem mudança de comportamento
- [ ] `test`: adição ou correção de testes
- [ ] `docs`: documentação
- [ ] `chore`: tarefa técnica / manutenção
- [ ] `ci`: CI/CD

## Descrição

<!-- Descreva brevemente o que foi feito e por quê -->

## Issues relacionadas

Closes #<!-- número da issue -->

## Checklist geral

- [ ] Código compila sem erros (`pnpm typecheck`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Testes passando (`pnpm test`)
- [ ] Build funciona (`pnpm build`)
- [ ] Sem `console.log` esquecidos

## Checklist — Phaser / Game Engine (preencher se aplicável)

- [ ] Canvas responsivo (testado com resize)
- [ ] Sem memory leak: listeners do EventBus removidos no cleanup
- [ ] Sprites destroídos corretamente ao sair da cena
- [ ] Mock mode (`VITE_MOCK_MODE=true`) continua funcionando
- [ ] Performance: sem `update()` loop pesado desnecessário

## Screenshots / GIF (obrigatório para mudanças visuais)

<!-- Se mudança visual, adicione screenshot ou GIF -->

## Notas para o revisor

<!-- Algo que o revisor precisa saber ou áreas que precisam de atenção especial -->
