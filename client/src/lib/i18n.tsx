import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Lang = "en" | "ru";

const translations = {
  brand: { en: "Local Taste", ru: "Local Taste" },

  // Landing
  landing_badge: { en: "Homemade with love", ru: "Приготовлено с любовью" },
  landing_title_1: { en: "Delicious Home-Cooked", ru: "Вкусная домашняя" },
  landing_title_2: { en: "Meals Delivered", ru: "еда с доставкой" },
  landing_desc: {
    en: "Connect with talented home cooks in your area. Enjoy authentic, lovingly prepared meals delivered straight to your door.",
    ru: "Найдите талантливых домашних поваров рядом с вами. Наслаждайтесь аутентичными блюдами с доставкой до двери.",
  },
  sign_in: { en: "Sign In", ru: "Войти" },
  get_started: { en: "Get Started", ru: "Начать" },
  order_now: { en: "Order Now", ru: "Заказать" },
  become_cook_btn: { en: "Become a Cook", ru: "Стать поваром" },
  verified_cooks: { en: "Verified cooks", ru: "Проверенные повара" },
  rated_customers: { en: "Rated by customers", ru: "Оценки клиентов" },
  fast_delivery: { en: "Fast delivery", ru: "Быстрая доставка" },
  features: { en: "Features", ru: "Преимущества" },
  how_it_works: { en: "How It Works", ru: "Как это работает" },
  cuisines: { en: "Cuisines", ru: "Кухни" },
  why_choose: { en: "Why Choose Local Taste?", ru: "Почему Local Taste?" },
  why_choose_desc: {
    en: "We connect you with passionate home cooks who pour their heart into every dish.",
    ru: "Мы соединяем вас с увлечёнными домашними поварами, которые вкладывают душу в каждое блюдо.",
  },
  feat_verified_title: { en: "Verified Home Cooks", ru: "Проверенные повара" },
  feat_verified_desc: {
    en: "Every cook is verified with proper documentation and quality checks to ensure the highest food safety standards.",
    ru: "Каждый повар проверен с надлежащей документацией и контролем качества для обеспечения высших стандартов безопасности.",
  },
  feat_love_title: { en: "Made with Love", ru: "Приготовлено с любовью" },
  feat_love_desc: {
    en: "Each meal is prepared fresh with care, using quality ingredients and traditional family recipes passed down through generations.",
    ru: "Каждое блюдо приготовлено свежим с заботой, из качественных ингредиентов и по традиционным семейным рецептам.",
  },
  feat_cuisine_title: { en: "Diverse Cuisines", ru: "Разнообразные кухни" },
  feat_cuisine_desc: {
    en: "From Russian classics to Georgian delights, Italian favorites and more - discover authentic cuisines from talented cooks.",
    ru: "От русской классики до грузинских деликатесов, итальянских блюд и не только — откройте аутентичные кухни от талантливых поваров.",
  },
  how_works_desc: {
    en: "Getting delicious homemade food is as easy as 1-2-3",
    ru: "Получить вкусную домашнюю еду — проще простого",
  },
  step1_title: { en: "Browse & Choose", ru: "Выберите блюдо" },
  step1_desc: {
    en: "Explore dishes from verified home cooks near you. Filter by cuisine, dietary needs, and ratings.",
    ru: "Изучайте блюда от проверенных домашних поваров. Фильтруйте по кухне, диете и рейтингу.",
  },
  step2_title: { en: "Place Your Order", ru: "Оформите заказ" },
  step2_desc: {
    en: "Add your favorites to the cart, set your delivery address, and choose a convenient time.",
    ru: "Добавьте любимые блюда в корзину, укажите адрес доставки и выберите удобное время.",
  },
  step3_title: { en: "Enjoy Your Meal", ru: "Наслаждайтесь" },
  step3_desc: {
    en: "Freshly prepared food arrives at your door. Rate your experience and discover new favorites.",
    ru: "Свежеприготовленная еда приедет к вашей двери. Оцените опыт и откройте новые любимые блюда.",
  },
  popular_cuisines: { en: "Popular Cuisines", ru: "Популярные кухни" },
  popular_cuisines_desc: {
    en: "Explore a world of flavors from your neighborhood cooks",
    ru: "Откройте мир вкусов от поваров по соседству",
  },
  cuisine_russian: { en: "Russian", ru: "Русская" },
  cuisine_georgian: { en: "Georgian", ru: "Грузинская" },
  cuisine_italian: { en: "Italian", ru: "Итальянская" },
  cuisine_uzbek: { en: "Uzbek", ru: "Узбекская" },
  cuisine_ukrainian: { en: "Ukrainian", ru: "Украинская" },
  cuisine_armenian: { en: "Armenian", ru: "Армянская" },
  cuisine_japanese: { en: "Japanese", ru: "Японская" },
  cuisine_chinese: { en: "Chinese", ru: "Китайская" },
  cuisine_indian: { en: "Indian", ru: "Индийская" },
  cuisine_french: { en: "French", ru: "Французская" },
  cta_title: { en: "Ready to taste the difference?", ru: "Готовы попробовать разницу?" },
  cta_desc: {
    en: "Join thousands of food lovers enjoying authentic homemade meals. Sign up today and get your first order.",
    ru: "Присоединяйтесь к тысячам гурманов, наслаждающихся домашней едой. Зарегистрируйтесь и сделайте первый заказ.",
  },
  get_started_free: { en: "Get Started Free", ru: "Начать бесплатно" },
  footer_rights: { en: "2026 Local Taste. All rights reserved.", ru: "2026 Local Taste. Все права защищены." },

  // Home
  welcome_back: { en: "Welcome back", ru: "С возвращением" },
  discover_desc: {
    en: "Discover delicious homemade meals from cooks near you",
    ru: "Откройте вкусные домашние блюда от поваров рядом с вами",
  },
  love_cooking: { en: "Love cooking? Share your talent!", ru: "Любите готовить? Поделитесь талантом!" },
  become_cook_desc: {
    en: "Become a cook and start earning with your recipes",
    ru: "Станьте поваром и начните зарабатывать на своих рецептах",
  },
  categories: { en: "Categories", ru: "Категории" },
  cuisine_label: { en: "Cuisine", ru: "Кухня" },
  all: { en: "All", ru: "Все" },
  search_placeholder: { en: "Search dishes, cuisines...", ru: "Поиск блюд, кухонь..." },
  no_dishes: { en: "No dishes found", ru: "Блюда не найдены" },
  no_dishes_search: { en: "Try adjusting your search or filters", ru: "Попробуйте изменить поиск или фильтры" },
  no_dishes_later: { en: "Check back later for new dishes from our cooks", ru: "Загляните позже за новыми блюдами от наших поваров" },
  dashboard: { en: "Dashboard", ru: "Панель" },
  admin: { en: "Admin", ru: "Админ" },

  // Dish card
  add: { en: "Add", ru: "В корзину" },
  sold_out: { en: "Sold out", ru: "Нет в наличии" },
  by_cook: { en: "by", ru: "от" },
  added_to_cart: { en: "Added to cart", ru: "Добавлено в корзину" },
  error: { en: "Error", ru: "Ошибка" },
  add_to_cart_error: { en: "Failed to add to cart", ru: "Не удалось добавить в корзину" },
  min: { en: "min", ru: "мин" },

  // Dish detail
  dish_not_found: { en: "Dish not found", ru: "Блюдо не найдено" },
  back_to_menu: { en: "Back to menu", ru: "Назад в меню" },
  nutritional_info: { en: "Nutritional Info (per serving)", ru: "Пищевая ценность (на порцию)" },
  protein: { en: "Protein", ru: "Белки" },
  fat: { en: "Fat", ru: "Жиры" },
  carbs: { en: "Carbs", ru: "Углеводы" },
  ingredients: { en: "Ingredients", ru: "Ингредиенты" },
  add_to_cart: { en: "Add to Cart", ru: "В корзину" },
  cooks_reply: { en: "Cook's reply", ru: "Ответ повара" },
  reviews: { en: "Reviews", ru: "Отзывы" },
  portions: { en: "portions", ru: "порций" },
  sign_in_to_cart: { en: "Please sign in to add to cart", ru: "Войдите, чтобы добавить в корзину" },

  // Cart
  cart: { en: "Cart", ru: "Корзина" },
  cart_empty: { en: "Your cart is empty", ru: "Ваша корзина пуста" },
  cart_empty_desc: { en: "Browse our menu and add your favorite dishes", ru: "Просмотрите меню и добавьте любимые блюда" },
  browse_menu: { en: "Browse Menu", ru: "Перейти в меню" },
  delivery_details: { en: "Delivery Details", ru: "Детали доставки" },
  delivery_address: { en: "Delivery Address", ru: "Адрес доставки" },
  enter_address: { en: "Enter your delivery address", ru: "Введите адрес доставки" },
  comment_optional: { en: "Comment (optional)", ru: "Комментарий (необязательно)" },
  comment_placeholder: { en: "Any special requests or instructions", ru: "Особые пожелания или инструкции" },
  total: { en: "Total", ru: "Итого" },
  place_order: { en: "Place Order", ru: "Оформить заказ" },
  placing: { en: "Placing...", ru: "Оформляем..." },
  order_placed: { en: "Order placed!", ru: "Заказ оформлен!" },
  order_sent_cook: { en: "Your order has been sent to the cook", ru: "Ваш заказ отправлен повару" },
  order_error: { en: "Failed to place order. Please check your details.", ru: "Не удалось оформить заказ. Проверьте данные." },
  currency: { en: "₸", ru: "₸" },
  rub: { en: "₸", ru: "₸" },

  // Orders
  my_orders: { en: "My Orders", ru: "Мои заказы" },
  no_orders: { en: "No orders yet", ru: "Заказов пока нет" },
  order_history_desc: { en: "Your order history will appear here", ru: "Здесь появится история ваших заказов" },
  order: { en: "Order", ru: "Заказ" },
  cancel: { en: "Cancel", ru: "Отменить" },
  review: { en: "Review", ru: "Отзыв" },
  leave_review: { en: "Leave a Review", ru: "Оставить отзыв" },
  rating: { en: "Rating", ru: "Оценка" },
  comment: { en: "Comment", ru: "Комментарий" },
  share_experience: { en: "Share your experience...", ru: "Поделитесь впечатлениями..." },
  submit_review: { en: "Submit Review", ru: "Отправить отзыв" },
  review_submitted: { en: "Review submitted", ru: "Отзыв отправлен" },
  review_thanks: { en: "Thank you for your feedback!", ru: "Спасибо за ваш отзыв!" },
  review_error: { en: "Failed to submit review", ru: "Не удалось отправить отзыв" },
  order_cancelled: { en: "Order cancelled", ru: "Заказ отменён" },

  // Order statuses
  status_pending: { en: "Pending", ru: "Ожидает" },
  status_confirmed: { en: "Confirmed", ru: "Подтверждён" },
  status_preparing: { en: "Preparing", ru: "Готовится" },
  status_ready: { en: "Ready", ru: "Готов" },
  status_delivering: { en: "On the way", ru: "В пути" },
  status_delivered: { en: "Delivered", ru: "Доставлен" },
  status_cancelled: { en: "Cancelled", ru: "Отменён" },

  // Favorites
  favorites: { en: "Favorites", ru: "Избранное" },
  no_favorites: { en: "No favorites yet", ru: "Нет избранного" },
  no_favorites_desc: { en: "Save dishes you love to find them easily", ru: "Сохраняйте любимые блюда для быстрого доступа" },

  // Become cook
  become_cook_title: { en: "Become a Cook", ru: "Стать поваром" },
  share_talent: { en: "Share your culinary talent", ru: "Поделитесь кулинарным талантом" },
  become_cook_page_desc: {
    en: "Join our community of home cooks and start earning by preparing delicious meals for customers in your area.",
    ru: "Присоединяйтесь к сообществу домашних поваров и начните зарабатывать, готовя вкусные блюда для клиентов.",
  },
  display_name: { en: "Display Name", ru: "Отображаемое имя" },
  display_name_placeholder: { en: "How customers will see you", ru: "Как вас увидят клиенты" },
  profile_photo: { en: "Profile Photo", ru: "Фото профиля" },
  upload_photo: { en: "Upload Photo", ru: "Загрузить фото" },
  uploading: { en: "Uploading...", ru: "Загрузка..." },
  about_you: { en: "About You", ru: "О вас" },
  about_placeholder: { en: "Tell customers about yourself and your cooking...", ru: "Расскажите о себе и своей кулинарии..." },
  specialization: { en: "Specialization", ru: "Специализация" },
  specialization_placeholder: { en: "e.g., Georgian cuisine, Pastries, Soups", ru: "напр., Грузинская кухня, Выпечка, Супы" },
  cuisine_types: { en: "Cuisine Types (comma separated)", ru: "Типы кухни (через запятую)" },
  cuisine_types_placeholder: { en: "Russian, Georgian, Italian", ru: "Русская, Грузинская, Итальянская" },
  experience: { en: "Experience", ru: "Опыт" },
  experience_placeholder: { en: "Describe your cooking experience...", ru: "Опишите ваш кулинарный опыт..." },
  submit_application: { en: "Submit Application", ru: "Отправить заявку" },
  submitting: { en: "Submitting...", ru: "Отправляем..." },
  application_submitted: { en: "Application submitted!", ru: "Заявка отправлена!" },
  application_review: { en: "Your cook application is under review.", ru: "Ваша заявка на рассмотрении." },
  application_error: { en: "Failed to submit application", ru: "Не удалось отправить заявку" },
  photo_uploaded: { en: "Photo uploaded", ru: "Фото загружено" },
  upload_failed: { en: "Upload failed", ru: "Загрузка не удалась" },

  // Cook dashboard
  cook_dashboard: { en: "Cook Dashboard", ru: "Панель повара" },
  under_review: { en: "Under Review", ru: "На проверке" },
  approved: { en: "Approved", ru: "Одобрено" },
  active_orders: { en: "Active Orders", ru: "Активные заказы" },
  total_orders: { en: "Total Orders", ru: "Всего заказов" },
  revenue: { en: "Revenue", ru: "Выручка" },
  orders_tab: { en: "Orders", ru: "Заказы" },
  menu_tab: { en: "Menu", ru: "Меню" },
  no_orders_cook: { en: "No orders yet", ru: "Заказов пока нет" },
  client_label: { en: "Client", ru: "Клиент" },
  delivery: { en: "Delivery", ru: "Доставка" },
  reject: { en: "Reject", ru: "Отклонить" },
  accept: { en: "Accept", ru: "Принять" },
  start_cooking: { en: "Start Cooking", ru: "Начать готовить" },
  mark_ready: { en: "Mark Ready", ru: "Готов" },
  send_delivery: { en: "Send for Delivery", ru: "Отправить" },
  mark_delivered: { en: "Mark Delivered", ru: "Доставлено" },
  your_dishes: { en: "Your Dishes", ru: "Ваши блюда" },
  add_dish: { en: "Add Dish", ru: "Добавить блюдо" },
  active: { en: "Active", ru: "Активно" },
  hidden: { en: "Hidden", ru: "Скрыто" },
  no_dishes_cook: { en: "No dishes yet", ru: "Блюд пока нет" },
  add_first_dish: { en: "Add Your First Dish", ru: "Добавьте первое блюдо" },
  add_new_dish: { en: "Add New Dish", ru: "Новое блюдо" },
  dish_name: { en: "Name", ru: "Название" },
  dish_name_placeholder: { en: "Dish name", ru: "Название блюда" },
  description: { en: "Description", ru: "Описание" },
  describe_dish: { en: "Describe the dish...", ru: "Опишите блюдо..." },
  list_ingredients: { en: "List ingredients...", ru: "Перечислите ингредиенты..." },
  price_rub: { en: "Price (₸)", ru: "Цена (₸)" },
  cooking_time: { en: "Cooking Time (min)", ru: "Время готовки (мин)" },
  weight_g: { en: "Weight (g)", ru: "Вес (г)" },
  calories: { en: "Calories", ru: "Калории" },
  cuisine_type: { en: "Cuisine Type", ru: "Тип кухни" },
  cuisine_dish_placeholder: { en: "Russian, Georgian, Italian...", ru: "Русская, Грузинская, Итальянская..." },
  photos: { en: "Photos", ru: "Фото" },
  add_photo: { en: "Add Photo", ru: "Добавить фото" },
  save_dish: { en: "Save Dish", ru: "Сохранить" },
  saving: { en: "Saving...", ru: "Сохраняем..." },
  dish_created: { en: "Dish created!", ru: "Блюдо создано!" },
  dish_error: { en: "Failed to create dish", ru: "Не удалось создать блюдо" },
  order_updated: { en: "Order updated", ru: "Заказ обновлён" },

  // Admin
  admin_panel: { en: "Admin Panel", ru: "Панель администратора" },
  users: { en: "Users", ru: "Пользователи" },
  cooks: { en: "Cooks", ru: "Повара" },
  pending_cooks: { en: "Pending Cooks", ru: "Ожидающие повара" },
  all_cooks: { en: "All Cooks", ru: "Все повара" },
  all_orders: { en: "Orders", ru: "Заказы" },
  no_specialization: { en: "No specialization", ru: "Без специализации" },
  approve: { en: "Approve", ru: "Одобрить" },
  no_pending: { en: "No pending applications", ru: "Нет ожидающих заявок" },
  no_cooks: { en: "No cooks yet", ru: "Поваров пока нет" },
  cook_status_updated: { en: "Cook status updated", ru: "Статус повара обновлён" },
  update_error: { en: "Failed to update", ru: "Не удалось обновить" },

  // Cook profile
  cook_not_found: { en: "Cook not found", ru: "Повар не найден" },
  about: { en: "About", ru: "О поваре" },
  menu: { en: "Menu", ru: "Меню" },
  available: { en: "Available", ru: "Доступен" },
  unavailable: { en: "Unavailable", ru: "Недоступен" },
  no_dishes_available: { en: "No dishes available", ru: "Нет доступных блюд" },

  // Not found
  page_not_found: { en: "404 Page Not Found", ru: "404 Страница не найдена" },
  page_not_found_desc: { en: "The page you're looking for doesn't exist.", ru: "Страница, которую вы ищете, не существует." },

  // Cook profile
  no_cook_profile: { en: "No cook profile found", ru: "Профиль повара не найден" },
  apply_first: { en: "Apply to become a cook first", ru: "Сначала подайте заявку на повара" },
  apply_now: { en: "Apply Now", ru: "Подать заявку" },

  loading: { en: "Loading...", ru: "Загрузка..." },
  default_user: { en: "User", ru: "Пользователь" },
  default_foodie: { en: "foodie", ru: "гурман" },
  default_customer: { en: "Customer", ru: "Клиент" },

  // Home page (cook cards)
  our_cooks: { en: "Our Cooks", ru: "Наши повара" },
  choose_cook: { en: "Choose a cook and explore their menu", ru: "Выберите повара и изучите его меню" },
  search_cooks_placeholder: { en: "Search cooks, cuisines...", ru: "Поиск поваров, кухонь..." },
  no_cooks_found: { en: "No cooks found", ru: "Повара не найдены" },
  no_cooks_search: { en: "Try adjusting your search or filters", ru: "Попробуйте изменить поиск или фильтры" },
  no_cooks_later: { en: "Check back later for new cooks", ru: "Загляните позже — появятся новые повара" },
  dishes_count: { en: "dishes", ru: "блюд" },
  orders_count: { en: "orders", ru: "заказов" },
  view_menu: { en: "View Menu", ru: "Посмотреть меню" },
  cuisine_kazakh: { en: "Kazakh", ru: "Казахская" },

  // Auth
  email: { en: "Email", ru: "Электронная почта" },
  password: { en: "Password", ru: "Пароль" },
  confirm_password: { en: "Confirm Password", ru: "Подтвердите пароль" },
  first_name: { en: "First Name", ru: "Имя" },
  last_name: { en: "Last Name", ru: "Фамилия" },
  register: { en: "Register", ru: "Зарегистрироваться" },
  login: { en: "Log In", ru: "Войти" },
  login_title: { en: "Welcome Back", ru: "С возвращением" },
  register_title: { en: "Create Account", ru: "Создать аккаунт" },
  login_subtitle: { en: "Sign in to your account", ru: "Войдите в свой аккаунт" },
  register_subtitle: { en: "Join Local Taste today", ru: "Присоединяйтесь к Local Taste" },
  already_have_account: { en: "Already have an account?", ru: "Уже есть аккаунт?" },
  dont_have_account: { en: "Don't have an account?", ru: "Нет аккаунта?" },
  registration_success: { en: "Registration successful!", ru: "Регистрация прошла успешно!" },
  login_error: { en: "Invalid email or password", ru: "Неверный email или пароль" },
  passwords_dont_match: { en: "Passwords don't match", ru: "Пароли не совпадают" },
  email_taken: { en: "This email is already registered", ru: "Этот email уже зарегистрирован" },
  password_min: { en: "Password must be at least 6 characters", ru: "Пароль должен быть не менее 6 символов" },
  email_required: { en: "Email is required", ru: "Введите email" },
  or_login_with: { en: "or sign in with", ru: "или войдите через" },
  replit_auth: { en: "Replit", ru: "Replit" },
  login_required: { en: "Please log in to continue", ru: "Войдите, чтобы продолжить" },
  login_to_order: { en: "Log in to add items to cart", ru: "Войдите, чтобы добавлять в корзину" },

  // Registration role
  register_as: { en: "Register as", ru: "Зарегистрироваться как" },
  role_client: { en: "Customer", ru: "Клиент" },
  role_cook: { en: "Cook", ru: "Повар" },
  phone: { en: "Phone", ru: "Телефон" },
  phone_placeholder: { en: "+7 (___) ___-__-__", ru: "+7 (___) ___-__-__" },
  address: { en: "Address", ru: "Адрес" },
  address_placeholder: { en: "Delivery address", ru: "Адрес доставки" },

  // Checkout
  checkout: { en: "Checkout", ru: "Оформление заказа" },
  order_summary: { en: "Order Summary", ru: "Состав заказа" },
  delivery_time: { en: "Delivery Time", ru: "Время доставки" },
  delivery_time_placeholder: { en: "Choose delivery time", ru: "Выберите время доставки" },
  proceed_to_checkout: { en: "Proceed to Checkout", ru: "Перейти к оформлению" },
  back_to_cart: { en: "Back to Cart", ru: "Назад в корзину" },
  as_soon_as_possible: { en: "As soon as possible", ru: "Как можно скорее" },

  // Moderator panel
  moderator_panel: { en: "Moderator Panel", ru: "Панель модератора" },
  cook_applications: { en: "Cook Applications", ru: "Заявки поваров" },
  review_applications_desc: { en: "Review and approve cook applications", ru: "Рассмотрите и одобрите заявки поваров" },
  rejection_reason: { en: "Rejection reason", ru: "Причина отклонения" },
  rejection_reason_placeholder: { en: "Enter reason for rejection...", ru: "Укажите причину отклонения..." },
  bio_label: { en: "Bio", ru: "О себе" },
  experience_label: { en: "Experience", ru: "Опыт" },

  // Admin enhancements
  user_management: { en: "User Management", ru: "Управление пользователями" },
  category_management: { en: "Categories", ru: "Категории" },
  analytics: { en: "Analytics", ru: "Аналитика" },
  change_role: { en: "Change Role", ru: "Изменить роль" },
  block_user: { en: "Block", ru: "Заблокировать" },
  unblock_user: { en: "Unblock", ru: "Разблокировать" },
  add_category: { en: "Add Category", ru: "Добавить категорию" },
  category_name: { en: "Category Name", ru: "Название категории" },
  category_name_ru: { en: "Name (Russian)", ru: "Название (русский)" },
  category_icon: { en: "Icon", ru: "Иконка" },
  save: { en: "Save", ru: "Сохранить" },
  platform_revenue: { en: "Platform Revenue", ru: "Выручка платформы" },
  active_cooks: { en: "Active Cooks", ru: "Активные повара" },
  total_users: { en: "Total Users", ru: "Всего пользователей" },
  role_updated: { en: "Role updated", ru: "Роль обновлена" },
  category_created: { en: "Category created", ru: "Категория создана" },

  // Dashboard sub-pages
  overview: { en: "Overview", ru: "Обзор" },
  menu_management: { en: "Menu", ru: "Меню" },
  order_management: { en: "Orders", ru: "Заказы" },
  statistics: { en: "Statistics", ru: "Статистика" },
  top_dishes: { en: "Top Dishes", ru: "Топ блюда" },
  earnings: { en: "Earnings", ru: "Заработок" },
  this_month: { en: "This Month", ru: "За месяц" },
  all_time: { en: "All Time", ru: "За всё время" },

  // Rating filter
  rating_filter: { en: "Rating", ru: "Рейтинг" },
  rating_4_plus: { en: "4+ stars", ru: "4+ звёзд" },
  rating_any: { en: "Any rating", ru: "Любой рейтинг" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lang");
      if (saved === "ru" || saved === "en") return saved;
    }
    return "ru";
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry.en;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
