---
Task ID: 1
Agent: main
Task: Restructure leads table rows — move contacts to row 1, statuses to row 2

Work Log:
- Read current leads-table.tsx layout (row 1: org+zayavka+status+partner+manager+delete, row 2: phone+email+margin+activity+comment)
- Swapped layout per user request:
  - Row 1: Организация | Телефон | Почта | Менеджер | 🗑
  - Row 2: Заявка | Статус | Партнёр | Маржа | Вид деятельности | Комментарий
- Updated grid template columns to accommodate new layout
- Updated column header legend labels
- Ran lint — clean

Stage Summary:
- Desktop card-table layout restructured with contacts on row 1 alongside org and manager
- Status badges (Заявка, Статус, Партнёр) moved to row 2
- File: src/components/leads/leads-table.tsx

