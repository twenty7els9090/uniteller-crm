import { db } from '../src/lib/db'
import { randomUUID } from 'crypto'

async function main() {
  // Clean existing data
  await db.lead.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()

  // Create users
  const admin = await db.user.create({
    data: {
      username: 'admin',
      password: 'admin123',
      fullName: 'Администратор Uniteller',
      role: 'uniteller',
    },
  })

  const vtbUser = await db.user.create({
    data: {
      username: 'vtb',
      password: 'vtb123',
      fullName: 'Иванов Иван (ВТБ)',
      role: 'vtb',
    },
  })

  const vtbUser2 = await db.user.create({
    data: {
      username: 'vtb2',
      password: 'vtb123',
      fullName: 'Петрова Анна (ВТБ)',
      role: 'vtb',
    },
  })

  // Create sample leads
  const leads = [
    {
      organization: 'ООО "ТехноПром"',
      partner: 'ВТБ',
      zayavka: 'Выполнена',
      status: 'Договор подписан',
      comment: 'Клиент доволен сервисом',
      contactInfo: '+7 (495) 123-45-67, info@technoprom.ru',
      margin: '0.3% (Автомойка)',
      manager: 'Иванов Иван',
    },
    {
      organization: 'ЗАО "РосТорг"',
      partner: 'ВТБ',
      zayavka: 'В работе',
      status: 'На согласовании',
      comment: 'Ждём ответ от банка',
      contactInfo: '+7 (495) 987-65-43',
      margin: '0.25% (Ресторан)',
      manager: 'Иванов Иван',
    },
    {
      organization: 'ИП Кузнецов',
      partner: 'ВТБ',
      zayavka: 'На паузе',
      status: 'Требуются документы',
      comment: 'Клиент не предоставил паспорт',
      contactInfo: '+7 (916) 555-33-22',
      margin: '0.35% (Супермаркет)',
      manager: 'Петрова Анна',
    },
    {
      organization: 'ООО "Вендотек Сервис"',
      partner: 'Vendotek',
      zayavka: 'Выполнена',
      status: 'Оборудование установлено',
      comment: '',
      contactInfo: 'support@vendotek.ru',
      margin: '0.4% (Фастфуд)',
      manager: 'Сидоров Алексей',
    },
    {
      organization: 'ООО "Кофейная Гуща"',
      partner: 'ВТБ',
      zayavka: 'В работе',
      status: 'Монтаж терминала',
      comment: 'Техник выехал на объект',
      contactInfo: '+7 (903) 111-22-33',
      margin: '0.3% (Кафе)',
      manager: 'Петрова Анна',
    },
    {
      organization: 'ПАО "МегаСтрой"',
      partner: 'Vendotek',
      zayavka: 'Отклонена',
      status: 'Не прошла проверка',
      comment: 'Негативная кредитная история',
      contactInfo: 'finance@megastroy.ru',
      margin: '',
      manager: 'Сидоров Алексей',
    },
    {
      organization: 'ООО "АвтоМир"',
      partner: 'ВТБ',
      zayavka: 'Выполнена',
      status: 'Активный клиент',
      comment: 'Регулярные транзакции',
      contactInfo: '+7 (495) 222-33-44',
      margin: '0.28% (СТО)',
      manager: 'Иванов Иван',
    },
    {
      organization: 'ИП Смирнова',
      partner: 'Vendotek',
      zayavka: 'В работе',
      status: 'Подготовка документов',
      comment: '',
      contactInfo: '+7 (926) 444-55-66',
      margin: '0.32% (Парикмахерская)',
      manager: 'Козлова Мария',
    },
    {
      organization: 'ООО "ФудСервис"',
      partner: 'ВТБ',
      zayavka: 'На паузе',
      status: 'Ожидание решения',
      comment: 'Рассмотрение руководством',
      contactInfo: '+7 (499) 777-88-99, office@foodservice.ru',
      margin: '0.33% (Столовая)',
      manager: 'Иванов Иван',
    },
    {
      organization: 'ЗАО "СтройМатериалы"',
      partner: 'Vendotek',
      zayavka: 'Выполнена',
      status: 'Тестовый период',
      comment: 'Две недели тестирования',
      contactInfo: '+7 (495) 666-77-88',
      margin: '0.27% (Магазин)',
      manager: 'Козлова Мария',
    },
    {
      organization: 'ООО "Аптека Здоровье"',
      partner: 'ВТБ',
      zayavka: 'В работе',
      status: 'Интеграция с кассой',
      comment: 'Проблема с API кассы',
      contactInfo: '+7 (800) 123-45-67',
      margin: '0.22% (Аптека)',
      manager: 'Петрова Анна',
    },
    {
      organization: 'ИП Попов',
      partner: 'Vendotek',
      zayavka: 'Выполнена',
      status: 'Контракт активен',
      comment: 'Платёжное решение подключено',
      contactInfo: '+7 (916) 999-88-77',
      margin: '0.38% (Салон красоты)',
      manager: 'Сидоров Алексей',
    },
  ]

  for (const lead of leads) {
    await db.lead.create({ data: lead })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${3} users and ${leads.length} leads`)
  console.log('')
  console.log('🔐 Login credentials:')
  console.log('  Uniteller: admin / admin123')
  console.log('  VTB #1:    vtb / vtb123')
  console.log('  VTB #2:    vtb2 / vtb123')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
