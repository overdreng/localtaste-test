import { db } from "./db";
import { categories, cookProfiles, dishes, users, userProfiles, reviews } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    const [existingCats] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories);

    if (existingCats?.count > 0) {
      console.log("Database already seeded, skipping initial seed...");
    } else {
      console.log("Seeding database...");

      const seedCategories = await db
        .insert(categories)
        .values([
          { name: "Soups", nameRu: "Супы", icon: "soup", sortOrder: 1 },
          { name: "Main Courses", nameRu: "Вторые блюда", icon: "utensils", sortOrder: 2 },
          { name: "Salads", nameRu: "Салаты", icon: "leaf", sortOrder: 3 },
          { name: "Pastries", nameRu: "Выпечка", icon: "cake", sortOrder: 4 },
          { name: "Desserts", nameRu: "Десерты", icon: "cake-slice", sortOrder: 5 },
          { name: "Appetizers", nameRu: "Закуски", icon: "cheese", sortOrder: 6 },
          { name: "Breakfasts", nameRu: "Завтраки", icon: "coffee", sortOrder: 7 },
          { name: "Drinks", nameRu: "Напитки", icon: "cup", sortOrder: 8 },
        ])
        .returning();

      const [seedUser1] = await db.insert(users).values({ id: "seed-cook-1", email: "maria@example.com", firstName: "Maria", lastName: "Ivanova" }).onConflictDoNothing().returning();
      const [seedUser2] = await db.insert(users).values({ id: "seed-cook-2", email: "georgi@example.com", firstName: "Georgi", lastName: "Kakhadze" }).onConflictDoNothing().returning();
      const [seedUser3] = await db.insert(users).values({ id: "seed-cook-3", email: "elena@example.com", firstName: "Elena", lastName: "Petrova" }).onConflictDoNothing().returning();

      if (!seedUser1 && !seedUser2 && !seedUser3) {
        console.log("Seed users already exist, skipping...");
      } else {
        const cook1Id = seedUser1?.id || "seed-cook-1";
        const cook2Id = seedUser2?.id || "seed-cook-2";
        const cook3Id = seedUser3?.id || "seed-cook-3";

        await db.insert(userProfiles).values([
          { userId: cook1Id, role: "cook" },
          { userId: cook2Id, role: "cook" },
          { userId: cook3Id, role: "cook" },
        ]).onConflictDoNothing();

        const [cookProfile1] = await db.insert(cookProfiles).values({
          userId: cook1Id, displayName: "Maria Ivanova",
          bio: "I have been cooking traditional Russian dishes for over 20 years. My grandmother taught me her secret recipes, and I am delighted to share them with you. Every dish is made with love and the freshest ingredients.",
          specialization: "Russian Cuisine", cuisineTypes: ["Russian", "Ukrainian"], experience: "20 years of home cooking, culinary courses",
          status: "approved", rating: "4.80", totalOrders: 156, isAvailable: true,
          workingHoursStart: "09:00", workingHoursEnd: "20:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        }).returning();

        const [cookProfile2] = await db.insert(cookProfiles).values({
          userId: cook2Id, displayName: "Georgi Kakhadze",
          bio: "Authentic Georgian cuisine from a chef born in Tbilisi. I prepare real khachapuri, khinkali, and other Georgian dishes using traditional family recipes and imported spices.",
          specialization: "Georgian Cuisine", cuisineTypes: ["Georgian", "Caucasian"], experience: "15 years, professional chef training in Tbilisi",
          status: "approved", rating: "4.90", totalOrders: 203, isAvailable: true,
          workingHoursStart: "10:00", workingHoursEnd: "21:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        }).returning();

        const [cookProfile3] = await db.insert(cookProfiles).values({
          userId: cook3Id, displayName: "Elena Petrova",
          bio: "I specialize in healthy, balanced meals and European cuisine. All dishes are prepared from organic ingredients with attention to nutrition and calorie content.",
          specialization: "Healthy & European Cuisine", cuisineTypes: ["Italian", "French", "Healthy"], experience: "10 years, nutritionist certification",
          status: "approved", rating: "4.70", totalOrders: 89, isAvailable: true,
          workingHoursStart: "08:00", workingHoursEnd: "19:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        }).returning();

        const soupsCat = seedCategories.find((c) => c.name === "Soups")!;
        const mainCat = seedCategories.find((c) => c.name === "Main Courses")!;
        const saladsCat = seedCategories.find((c) => c.name === "Salads")!;
        const pastryCat = seedCategories.find((c) => c.name === "Pastries")!;
        const dessertsCat = seedCategories.find((c) => c.name === "Desserts")!;

        await db.insert(dishes).values([
          {
            cookProfileId: cookProfile1.id, categoryId: soupsCat.id, name: "Homemade Borscht",
            description: "Classic Ukrainian borscht with beef, beets, and fresh vegetables. Served with sour cream and garlic rolls.",
            ingredients: "Beef, beets, cabbage, potatoes, carrots, onions, tomato paste, garlic, dill, sour cream",
            photos: ["/images/dish-borscht.png"], weight: 450, portions: 1, calories: 280, protein: "18.5", fat: "12.0", carbs: "25.0",
            price: "350", cookingTime: 90, cuisineType: "Russian", dietaryTags: ["hearty"], isAvailable: true, availablePortions: 8,
          },
          {
            cookProfileId: cookProfile1.id, categoryId: mainCat.id, name: "Homemade Pelmeni",
            description: "Hand-crafted Russian dumplings filled with a juicy mix of beef and pork. Served with sour cream and fresh dill.",
            ingredients: "Flour, eggs, beef, pork, onions, salt, pepper, sour cream, dill",
            photos: ["/images/dish-pelmeni.png"], weight: 400, portions: 1, calories: 420, protein: "22.0", fat: "18.0", carbs: "38.0",
            price: "450", cookingTime: 120, cuisineType: "Russian", dietaryTags: ["hearty", "protein-rich"], isAvailable: true, availablePortions: 6,
          },
          {
            cookProfileId: cookProfile1.id, categoryId: pastryCat.id, name: "Golden Pirozhki",
            description: "Fluffy baked pirozhki with various fillings — meat, cabbage, or potato. Baked to golden perfection.",
            ingredients: "Flour, yeast, milk, eggs, butter, filling (meat/cabbage/potato), onions",
            photos: ["/images/dish-pirozhki.png"], weight: 300, portions: 4, calories: 320, protein: "12.0", fat: "14.0", carbs: "36.0",
            price: "280", cookingTime: 60, cuisineType: "Russian", dietaryTags: ["vegetarian option"], isAvailable: true, availablePortions: 12,
          },
          {
            cookProfileId: cookProfile2.id, categoryId: mainCat.id, name: "Adjarian Khachapuri",
            description: "Boat-shaped Georgian cheese bread with bubbling cheese filling topped with a runny egg and butter.",
            ingredients: "Flour, yeast, suluguni cheese, imeruli cheese, eggs, butter, salt",
            photos: ["/images/dish-khachapuri.png"], weight: 350, portions: 1, calories: 520, protein: "20.0", fat: "28.0", carbs: "42.0",
            price: "480", cookingTime: 45, cuisineType: "Georgian", dietaryTags: ["vegetarian"], isAvailable: true, availablePortions: 5,
          },
          {
            cookProfileId: cookProfile2.id, categoryId: mainCat.id, name: "Beef Stroganoff",
            description: "Tender strips of beef in a rich, creamy mushroom sauce. Served with fresh pasta.",
            ingredients: "Beef tenderloin, mushrooms, onions, cream, butter, flour, paprika, fresh pasta",
            photos: ["/images/dish-stroganoff.png"], weight: 400, portions: 1, calories: 480, protein: "32.0", fat: "24.0", carbs: "28.0",
            price: "550", cookingTime: 60, cuisineType: "Georgian", dietaryTags: ["protein-rich"], isAvailable: true, availablePortions: 4,
          },
          {
            cookProfileId: cookProfile3.id, categoryId: saladsCat.id, name: "Caesar Salad with Chicken",
            description: "Fresh romaine lettuce with grilled chicken, homemade croutons, parmesan and signature Caesar dressing.",
            ingredients: "Romaine lettuce, chicken breast, parmesan, croutons, eggs, anchovies, garlic, olive oil, lemon",
            photos: ["/images/dish-salad.png"], weight: 350, portions: 1, calories: 320, protein: "28.0", fat: "16.0", carbs: "18.0",
            price: "380", cookingTime: 30, cuisineType: "Italian", dietaryTags: ["low-carb", "protein-rich"], isAvailable: true, availablePortions: 7,
          },
          {
            cookProfileId: cookProfile3.id, categoryId: dessertsCat.id, name: "Chocolate Berry Cake",
            description: "Rich chocolate cake layered with ganache and topped with fresh seasonal berries. Made with premium Belgian chocolate.",
            ingredients: "Dark chocolate, butter, eggs, flour, sugar, cream, fresh berries, cocoa powder",
            photos: ["/images/dish-cake.png"], weight: 250, portions: 1, calories: 380, protein: "6.0", fat: "22.0", carbs: "40.0",
            price: "420", cookingTime: 90, cuisineType: "French", dietaryTags: ["dessert"], isAvailable: true, availablePortions: 3,
          },
        ]);

        console.log("Database seeded successfully!");
      }
    }

    await seedTestUsers();
    await seedExtendedContent();
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function seedTestUsers() {
  try {
    await db.insert(users).values({ id: "test-client-1", email: "client@localtaste.test", firstName: "Алия", lastName: "Сейткали" }).onConflictDoNothing();
    await db.insert(userProfiles).values({ userId: "test-client-1", role: "client", phone: "+77001112233", address: "ул. Кенесары 40, Астана" }).onConflictDoNothing();

    await db.insert(users).values({ id: "test-cook-4", email: "cook@localtaste.test", firstName: "Айгерим", lastName: "Нурланова" }).onConflictDoNothing();
    await db.insert(userProfiles).values({ userId: "test-cook-4", role: "cook", phone: "+77012223344" }).onConflictDoNothing();

    const existingCookProfile = await db.select({ count: sql<number>`count(*)::int` }).from(cookProfiles).where(sql`user_id = 'test-cook-4'`);
    if (!existingCookProfile[0]?.count || existingCookProfile[0].count === 0) {
      const [cookProfile4] = await db.insert(cookProfiles).values({
        userId: "test-cook-4", displayName: "Айгерим Нурланова",
        bio: "Готовлю домашние казахские блюда с душой. Бешбармак, баурсаки, куырдак — всё по рецептам моей бабушки из Семея.",
        specialization: "Kazakh Cuisine", cuisineTypes: ["Kazakh", "Central Asian"],
        experience: "12 лет домашней готовки, победитель конкурса 'Лучший домашний повар Астаны'",
        status: "approved", rating: "4.85", totalOrders: 127, isAvailable: true,
        workingHoursStart: "09:00", workingHoursEnd: "20:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      }).returning();

      const [mainCat] = await db.select().from(categories).where(sql`name = 'Main Courses'`);
      const [soupsCat] = await db.select().from(categories).where(sql`name = 'Soups'`);
      const [pastryCat] = await db.select().from(categories).where(sql`name = 'Pastries'`);

      if (cookProfile4 && mainCat && soupsCat && pastryCat) {
        await db.insert(dishes).values([
          {
            cookProfileId: cookProfile4.id, categoryId: mainCat.id, name: "Бешбармак",
            description: "Традиционное казахское блюдо: нежная отварная баранина на тонких листах теста с ароматным луковым соусом.",
            ingredients: "Баранина, мука, яйца, лук, картофель, соль, перец, зелень",
            photos: ["/images/dish-pelmeni.png"], weight: 500, calories: 550, protein: "35.0", fat: "28.0", carbs: "38.0",
            price: "650", cookingTime: 120, cuisineType: "Kazakh", dietaryTags: ["hearty", "protein-rich"], isAvailable: true, availablePortions: 5,
          },
          {
            cookProfileId: cookProfile4.id, categoryId: mainCat.id, name: "Куырдак",
            description: "Жаркое из мяса и субпродуктов с картофелем и луком. Традиционное казахское блюдо.",
            ingredients: "Баранина, печень, сердце, картофель, лук, масло, специи",
            photos: ["/images/dish-stroganoff.png"], weight: 400, calories: 480, protein: "30.0", fat: "25.0", carbs: "30.0",
            price: "550", cookingTime: 60, cuisineType: "Kazakh", dietaryTags: ["hearty"], isAvailable: true, availablePortions: 6,
          },
          {
            cookProfileId: cookProfile4.id, categoryId: pastryCat.id, name: "Баурсаки",
            description: "Пышные жареные кусочки теста — традиционное казахское угощение. Подаются с мёдом.",
            ingredients: "Мука, молоко, яйца, дрожжи, сахар, масло для жарки",
            photos: ["/images/dish-pirozhki.png"], weight: 250, portions: 8, calories: 300, protein: "8.0", fat: "12.0", carbs: "42.0",
            price: "200", cookingTime: 40, cuisineType: "Kazakh", dietaryTags: ["vegetarian"], isAvailable: true, availablePortions: 10,
          },
          {
            cookProfileId: cookProfile4.id, categoryId: soupsCat.id, name: "Сорпа",
            description: "Наваристый бульон из баранины с овощами. Традиционный казахский суп с мясом и зеленью.",
            ingredients: "Баранина на кости, морковь, лук, картофель, зелень, соль",
            photos: ["/images/dish-borscht.png"], weight: 450, calories: 250, protein: "20.0", fat: "14.0", carbs: "12.0",
            price: "400", cookingTime: 90, cuisineType: "Kazakh", dietaryTags: ["hearty"], isAvailable: true, availablePortions: 7,
          },
        ]);
      }
    }

    await db.insert(users).values({ id: "test-moderator-1", email: "moderator@localtaste.test", firstName: "Данияр", lastName: "Модератов" }).onConflictDoNothing();
    await db.insert(userProfiles).values({ userId: "test-moderator-1", role: "moderator", phone: "+77023334455" }).onConflictDoNothing();

    await db.insert(users).values({ id: "test-admin-1", email: "admin@localtaste.test", firstName: "Администратор", lastName: "Local Taste" }).onConflictDoNothing();
    await db.insert(userProfiles).values({ userId: "test-admin-1", role: "admin", phone: "+77034445566" }).onConflictDoNothing();

    await db.insert(users).values({ id: "test-support-1", email: "support@localtaste.test", firstName: "Сервис", lastName: "Поддержки" }).onConflictDoNothing();
    await db.insert(userProfiles).values({ userId: "test-support-1", role: "support", phone: "+77045556677" }).onConflictDoNothing();

    const hashedPassword = await bcrypt.hash("test123", 10);
    const testUserIds = ["test-client-1", "test-cook-4", "test-moderator-1", "test-admin-1", "test-support-1"];
    for (const uid of testUserIds) {
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, uid));
    }

    console.log("✅ Test users seeded: client, cook, moderator, admin, support (password: test123)");
  } catch (error) {
    console.error("Error seeding test users:", error);
  }
}

async function seedExtendedContent() {
  try {
    const [cookCount] = await db.select({ count: sql<number>`count(*)::int` }).from(cookProfiles);
    if ((cookCount?.count || 0) >= 9) {
      console.log("Extended content already seeded, skipping...");
      return;
    }

    console.log("Seeding extended marketplace content...");

    // ── Category refs ────────────────────────────────────────────────────────
    const [soupsCat] = await db.select().from(categories).where(sql`name = 'Soups'`);
    const [mainCat] = await db.select().from(categories).where(sql`name = 'Main Courses'`);
    const [saladsCat] = await db.select().from(categories).where(sql`name = 'Salads'`);
    const [pastryCat] = await db.select().from(categories).where(sql`name = 'Pastries'`);
    const [dessertsCat] = await db.select().from(categories).where(sql`name = 'Desserts'`);
    const [breakfastCat] = await db.select().from(categories).where(sql`name = 'Breakfasts'`);
    const [appetizerCat] = await db.select().from(categories).where(sql`name = 'Appetizers'`);

    // ── Reviewer users ───────────────────────────────────────────────────────
    const reviewerIds = ["reviewer-1", "reviewer-2", "reviewer-3", "reviewer-4", "reviewer-5", "reviewer-6"];
    const reviewerNames = [
      { first: "Арман", last: "Джаксыбеков" },
      { first: "Сабина", last: "Мусина" },
      { first: "Руслан", last: "Ким" },
      { first: "Динара", last: "Ахметова" },
      { first: "Максим", last: "Шевченко" },
      { first: "Зарина", last: "Нурсеитова" },
    ];
    const hashedPw = await bcrypt.hash("test123", 10);
    for (let i = 0; i < reviewerIds.length; i++) {
      const rid = reviewerIds[i];
      await db.insert(users).values({
        id: rid, email: `${rid}@localtaste.test`,
        firstName: reviewerNames[i].first, lastName: reviewerNames[i].last,
        password: hashedPw,
      }).onConflictDoNothing();
      await db.insert(userProfiles).values({ userId: rid, role: "client" }).onConflictDoNothing();
    }

    // ── Cook 5: Yuki Tanaka — Japanese / Asian ───────────────────────────────
    const [u5] = await db.insert(users).values({ id: "seed-cook-5", email: "yuki@example.com", firstName: "Yuki", lastName: "Tanaka" }).onConflictDoNothing().returning();
    await db.insert(userProfiles).values({ userId: "seed-cook-5", role: "cook" }).onConflictDoNothing();
    const [cp5] = await db.insert(cookProfiles).values({
      userId: "seed-cook-5", displayName: "Yuki Tanaka",
      bio: "Born in Osaka and raised on authentic Japanese cooking. I bring the real tastes of Japan — from umami-rich ramen broth simmered for 12 hours to delicate sushi rolls made with premium ingredients. Every dish is an art form.",
      specialization: "Japanese & Asian Cuisine", cuisineTypes: ["Japanese", "Asian", "Korean"],
      experience: "18 years cooking Japanese cuisine, trained in Tokyo",
      status: "approved", rating: "4.95", totalOrders: 312, isAvailable: true,
      workingHoursStart: "11:00", workingHoursEnd: "22:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    }).returning();

    if (cp5) {
      await db.insert(dishes).values([
        {
          cookProfileId: cp5.id, categoryId: soupsCat?.id, name: "Tonkotsu Ramen",
          description: "Authentic Japanese ramen with rich pork bone broth simmered for 12 hours. Topped with chashu pork, soft-boiled egg, nori, and green onions. Pure comfort in a bowl.",
          ingredients: "Ramen noodles, pork bones, chashu pork, soft-boiled egg, nori, bamboo shoots, green onion, sesame oil, miso paste",
          photos: ["/images/dish-borscht.png"], weight: 550, portions: 1, calories: 620, protein: "38.0", fat: "24.0", carbs: "58.0",
          price: "750", cookingTime: 30, cuisineType: "Japanese", dietaryTags: ["hearty", "protein-rich"], isAvailable: true, availablePortions: 6,
        },
        {
          cookProfileId: cp5.id, categoryId: mainCat?.id, name: "Premium Sushi Set (12 pcs)",
          description: "A premium selection of 12 hand-rolled sushi pieces: salmon nigiri, tuna rolls, avocado rolls, and shrimp tempura rolls. Made with Japanese premium-grade rice and fresh fish.",
          ingredients: "Sushi rice, salmon, tuna, shrimp, avocado, nori, wasabi, pickled ginger, soy sauce",
          photos: ["/images/dish-salad.png"], weight: 420, portions: 12, calories: 480, protein: "28.0", fat: "12.0", carbs: "62.0",
          price: "1200", cookingTime: 45, cuisineType: "Japanese", dietaryTags: ["protein-rich"], isAvailable: true, availablePortions: 4,
        },
        {
          cookProfileId: cp5.id, categoryId: mainCat?.id, name: "Chicken Teriyaki Bowl",
          description: "Tender grilled chicken glazed with homemade teriyaki sauce served over steamed Japanese rice with pickled vegetables and sesame seeds.",
          ingredients: "Chicken thigh, soy sauce, mirin, sake, sugar, garlic, ginger, Japanese rice, sesame seeds",
          photos: ["/images/dish-stroganoff.png"], weight: 450, portions: 1, calories: 520, protein: "35.0", fat: "14.0", carbs: "52.0",
          price: "680", cookingTime: 35, cuisineType: "Japanese", dietaryTags: ["protein-rich"], isAvailable: true, availablePortions: 8,
        },
        {
          cookProfileId: cp5.id, categoryId: dessertsCat?.id, name: "Matcha Mochi Ice Cream",
          description: "Soft and chewy Japanese mochi filled with premium matcha green tea ice cream. A refreshing Japanese dessert loved worldwide.",
          ingredients: "Glutinous rice flour, matcha powder, green tea ice cream, sugar, cornstarch",
          photos: ["/images/dish-cake.png"], weight: 180, portions: 3, calories: 280, protein: "4.0", fat: "8.0", carbs: "46.0",
          price: "550", cookingTime: 20, cuisineType: "Japanese", dietaryTags: ["vegetarian", "dessert"], isAvailable: true, availablePortions: 10,
        },
      ]);

      // Reviews for Yuki
      const yukiReviews = [
        { clientId: "reviewer-1", rating: 5, comment: "Лучший раmen в Астане! Бульон просто фантастический, варится 12 часов — это чувствуется. Буду заказывать каждую неделю!" },
        { clientId: "reviewer-2", rating: 5, comment: "Суши-сет выглядит как в ресторане. Рыба свежайшая, рис идеальный. Юки — настоящий мастер своего дела!" },
        { clientId: "reviewer-3", rating: 5, comment: "Курица терияки — любовь с первого кусочка. Соус домашний, аромат неповторимый. Огромное спасибо!" },
        { clientId: "reviewer-4", rating: 4, comment: "Отличное качество, доставили горячим. Моти с матчей — просто шедевр. Единственное — хотелось бы больше порцию рамена." },
        { clientId: "reviewer-5", rating: 5, comment: "Заказываю уже третий раз. Стабильно вкусно, всегда свежо. Настоящая японская кухня у меня дома — мечта!" },
      ];
      for (const r of yukiReviews) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: cp5.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
      await db.update(cookProfiles).set({ rating: "4.80" }).where(eq(cookProfiles.id, cp5.id));
    }

    // ── Cook 6: Fatima Abenova — Uzbek / Central Asian ──────────────────────
    const [u6] = await db.insert(users).values({ id: "seed-cook-6", email: "fatima@example.com", firstName: "Фатима", lastName: "Абенова" }).onConflictDoNothing().returning();
    await db.insert(userProfiles).values({ userId: "seed-cook-6", role: "cook" }).onConflictDoNothing();
    const [cp6] = await db.insert(cookProfiles).values({
      userId: "seed-cook-6", displayName: "Фатима Абенова",
      bio: "Я из Самарканда, и узбекская кухня — это моя страсть. Плов, самса, лагман — всё готовлю по рецептам, которые передавались в нашей семье из поколения в поколение. Каждое блюдо — это тепло домашнего очага.",
      specialization: "Uzbek & Central Asian Cuisine", cuisineTypes: ["Uzbek", "Central Asian", "Kazakh"],
      experience: "22 года, обучение у мастеров-плоовщиков Самарканда",
      status: "approved", rating: "4.92", totalOrders: 278, isAvailable: true,
      workingHoursStart: "08:00", workingHoursEnd: "20:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    }).returning();

    if (cp6) {
      await db.insert(dishes).values([
        {
          cookProfileId: cp6.id, categoryId: mainCat?.id, name: "Узбекский Плов",
          description: "Настоящий самаркандский плов из баранины с рисом девзира, морковью и специями. Готовится в казане по традиционному рецепту. Невозможно устоять перед ароматом зиры и барбариса.",
          ingredients: "Рис девзира, баранина, морковь, лук, чеснок, зира, барбарис, куркума, масло хлопковое",
          photos: ["/images/dish-pelmeni.png"], weight: 500, portions: 1, calories: 580, protein: "28.0", fat: "22.0", carbs: "65.0",
          price: "600", cookingTime: 150, cuisineType: "Uzbek", dietaryTags: ["hearty"], isAvailable: true, availablePortions: 8,
        },
        {
          cookProfileId: cp6.id, categoryId: pastryCat?.id, name: "Самса с мясом",
          description: "Слоёные треугольные пирожки с сочной начинкой из баранины и лука, запечённые в настоящем тандыре. Корочка хрустящая, начинка нежная.",
          ingredients: "Мука, масло, баранина, лук, зира, соль, перец чёрный",
          photos: ["/images/dish-pirozhki.png"], weight: 360, portions: 3, calories: 420, protein: "18.0", fat: "20.0", carbs: "38.0",
          price: "350", cookingTime: 60, cuisineType: "Uzbek", dietaryTags: ["hearty"], isAvailable: true, availablePortions: 12,
        },
        {
          cookProfileId: cp6.id, categoryId: soupsCat?.id, name: "Лагман",
          description: "Густой суп с тянутой домашней лапшой, говядиной и овощами в пряном томатном бульоне. Настоящий лагман по-уйгурски.",
          ingredients: "Говядина, домашняя лапша, помидоры, болгарский перец, баклажан, чеснок, зира, лук",
          photos: ["/images/dish-borscht.png"], weight: 500, portions: 1, calories: 450, protein: "25.0", fat: "16.0", carbs: "48.0",
          price: "480", cookingTime: 90, cuisineType: "Uzbek", dietaryTags: ["hearty", "protein-rich"], isAvailable: true, availablePortions: 6,
        },
        {
          cookProfileId: cp6.id, categoryId: dessertsCat?.id, name: "Чак-чак",
          description: "Медовое лакомство из жареного теста, залитое горячим мёдом с орехами. Традиционное центральноазиатское угощение к чаю.",
          ingredients: "Мука, яйца, масло для жарки, мёд, грецкие орехи",
          photos: ["/images/dish-cake.png"], weight: 200, portions: 4, calories: 450, protein: "7.0", fat: "18.0", carbs: "62.0",
          price: "300", cookingTime: 45, cuisineType: "Uzbek", dietaryTags: ["vegetarian", "dessert"], isAvailable: true, availablePortions: 8,
        },
      ]);

      const fatimaReviews = [
        { clientId: "reviewer-2", rating: 5, comment: "Плов — это поэзия! Рис рассыпчатый, мясо тает во рту. Фатима готовит как настоящая самаркандская мастерица. Рекомендую всем!" },
        { clientId: "reviewer-3", rating: 5, comment: "Самса просто волшебная — тесто слоёное, начинка сочная. Напомнило детство у бабушки. Буду заказывать снова и снова!" },
        { clientId: "reviewer-4", rating: 5, comment: "Лагман превзошёл все ожидания. Такой насыщенный бульон, домашняя лапша — чувствуется настоящий труд и любовь к делу." },
        { clientId: "reviewer-1", rating: 5, comment: "Чак-чак — объедение! Принесла на день рождения, гости были в восторге. Все спрашивали рецепт, пришлось дать контакт Фатимы." },
        { clientId: "reviewer-5", rating: 4, comment: "Очень вкусно и аутентично. Плов и самса — на уровне ресторана. Немного долгое время приготовления, но оно того стоит!" },
      ];
      for (const r of fatimaReviews) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: cp6.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
      await db.update(cookProfiles).set({ rating: "4.80" }).where(eq(cookProfiles.id, cp6.id));
    }

    // ── Cook 7: Anna Müller — Baking & Desserts ──────────────────────────────
    const [u7] = await db.insert(users).values({ id: "seed-cook-7", email: "anna@example.com", firstName: "Anna", lastName: "Müller" }).onConflictDoNothing().returning();
    await db.insert(userProfiles).values({ userId: "seed-cook-7", role: "cook" }).onConflictDoNothing();
    const [cp7] = await db.insert(cookProfiles).values({
      userId: "seed-cook-7", displayName: "Anna Müller",
      bio: "A German-trained pastry chef with a passion for artisan baking. From sourdough loaves to layered cakes and croissants — everything is handmade with premium ingredients and lots of love. My bakery fills homes with the smell of happiness.",
      specialization: "European Baking & Pastry", cuisineTypes: ["German", "French", "European"],
      experience: "14 years, trained at Vienna pastry school",
      status: "approved", rating: "4.88", totalOrders: 445, isAvailable: true,
      workingHoursStart: "07:00", workingHoursEnd: "18:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    }).returning();

    if (cp7) {
      await db.insert(dishes).values([
        {
          cookProfileId: cp7.id, categoryId: breakfastCat?.id ?? pastryCat?.id, name: "Sourdough Bread Loaf",
          description: "Artisan sourdough bread with a crispy golden crust and chewy, tangy interior. Made with 72-hour fermentation for maximum flavour and digestibility. 900g whole loaf.",
          ingredients: "Organic wheat flour, sourdough starter, water, sea salt",
          photos: ["/images/dish-pirozhki.png"], weight: 900, portions: 8, calories: 220, protein: "8.0", fat: "1.5", carbs: "44.0",
          price: "680", cookingTime: 240, cuisineType: "European", dietaryTags: ["vegan", "healthy"], isAvailable: true, availablePortions: 5,
        },
        {
          cookProfileId: cp7.id, categoryId: pastryCat?.id, name: "Butter Croissants (4 pcs)",
          description: "Flaky, buttery croissants made with 27 layers of pure French butter dough. Golden on the outside, airy and soft inside. Best enjoyed warm.",
          ingredients: "Flour, French butter, milk, eggs, sugar, yeast, salt",
          photos: ["/images/dish-pirozhki.png"], weight: 280, portions: 4, calories: 380, protein: "8.0", fat: "22.0", carbs: "38.0",
          price: "480", cookingTime: 180, cuisineType: "French", dietaryTags: ["vegetarian"], isAvailable: true, availablePortions: 8,
        },
        {
          cookProfileId: cp7.id, categoryId: dessertsCat?.id, name: "Black Forest Cake",
          description: "Classic German Schwarzwälder Kirschtorte — layers of light chocolate sponge, fresh whipped cream and cherries with a hint of kirsch liqueur. Decorated with chocolate shavings.",
          ingredients: "Dark chocolate sponge, whipping cream, fresh cherries, kirsch, chocolate shavings, sugar",
          photos: ["/images/dish-cake.png"], weight: 300, portions: 1, calories: 420, protein: "5.0", fat: "24.0", carbs: "46.0",
          price: "580", cookingTime: 120, cuisineType: "German", dietaryTags: ["dessert"], isAvailable: true, availablePortions: 6,
        },
        {
          cookProfileId: cp7.id, categoryId: breakfastCat?.id ?? pastryCat?.id, name: "Eggs Benedict with Smoked Salmon",
          description: "Classic brunch favourite — poached eggs on toasted English muffins with smoked salmon and homemade hollandaise sauce. Garnished with capers and dill.",
          ingredients: "Eggs, English muffins, smoked salmon, hollandaise sauce, capers, dill, butter, lemon",
          photos: ["/images/dish-salad.png"], weight: 320, portions: 1, calories: 480, protein: "28.0", fat: "32.0", carbs: "24.0",
          price: "680", cookingTime: 25, cuisineType: "European", dietaryTags: ["protein-rich"], isAvailable: true, availablePortions: 5,
        },
        {
          cookProfileId: cp7.id, categoryId: dessertsCat?.id, name: "Tiramisu (Jar)",
          description: "Individual-sized classic Italian tiramisu in a jar. Layers of espresso-soaked ladyfingers, mascarpone cream and premium cocoa powder. Rich, creamy and absolutely divine.",
          ingredients: "Mascarpone, ladyfingers, espresso, eggs, sugar, cocoa powder, cream",
          photos: ["/images/dish-cake.png"], weight: 200, portions: 1, calories: 390, protein: "7.0", fat: "20.0", carbs: "44.0",
          price: "450", cookingTime: 30, cuisineType: "Italian", dietaryTags: ["vegetarian", "dessert"], isAvailable: true, availablePortions: 10,
        },
      ]);

      const annaReviews = [
        { clientId: "reviewer-5", rating: 5, comment: "The sourdough bread is absolutely incredible. Crispy crust, soft inside with that perfect tanginess. Best bread I've had outside of a real bakery!" },
        { clientId: "reviewer-6", rating: 5, comment: "Croissants were perfectly layered and buttery. Arrived still warm! Anna is a true pastry professional. Will order every weekend." },
        { clientId: "reviewer-1", rating: 5, comment: "Black Forest Cake was a showstopper at our dinner party. Everyone was amazed it was homemade. Anna's baking skills are extraordinary!" },
        { clientId: "reviewer-3", rating: 5, comment: "Eggs Benedict — restaurant quality at home! The hollandaise was perfectly balanced. Best brunch experience ever." },
        { clientId: "reviewer-4", rating: 5, comment: "Тирамису просто роскошный! Крем воздушный, кофейный вкус насыщенный. Анна готовит с настоящей страстью к своему делу." },
      ];
      for (const r of annaReviews) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: cp7.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
      await db.update(cookProfiles).set({ rating: "5.00" }).where(eq(cookProfiles.id, cp7.id));
    }

    // ── Cook 8: Dmitry Sorokin — BBQ & Grilling ──────────────────────────────
    const [u8] = await db.insert(users).values({ id: "seed-cook-8", email: "dmitry@example.com", firstName: "Дмитрий", lastName: "Сорокин" }).onConflictDoNothing().returning();
    await db.insert(userProfiles).values({ userId: "seed-cook-8", role: "cook" }).onConflictDoNothing();
    const [cp8] = await db.insert(cookProfiles).values({
      userId: "seed-cook-8", displayName: "Дмитрий Сорокин",
      bio: "Мастер мангала и гриля с 17-летним опытом. Готовлю настоящий шашлык из отборного мяса, люля-кебаб, стейки и блюда на углях. Мясо маринуется 24 часа по авторским рецептам — результат говорит сам за себя.",
      specialization: "BBQ & Grilling", cuisineTypes: ["Caucasian", "Russian", "Grilled"],
      experience: "17 лет, чемпион регионального конкурса мангальщиков",
      status: "approved", rating: "4.87", totalOrders: 189, isAvailable: true,
      workingHoursStart: "12:00", workingHoursEnd: "22:00", workingDays: ["Thu", "Fri", "Sat", "Sun"],
    }).returning();

    if (cp8) {
      await db.insert(dishes).values([
        {
          cookProfileId: cp8.id, categoryId: mainCat?.id, name: "Шашлык из баранины (500г)",
          description: "Отборная баранья корейка маринуется 24 часа в авторском маринаде с луком, зирой и гранатовым соком. Жарится на живых углях из вишнёвых дров.",
          ingredients: "Баранья корейка, лук, зира, гранатовый сок, паприка, соль, перец, свежая зелень",
          photos: ["/images/dish-stroganoff.png"], weight: 500, portions: 1, calories: 520, protein: "42.0", fat: "32.0", carbs: "5.0",
          price: "950", cookingTime: 60, cuisineType: "Caucasian", dietaryTags: ["protein-rich", "gluten-free"], isAvailable: true, availablePortions: 5,
        },
        {
          cookProfileId: cp8.id, categoryId: mainCat?.id, name: "Люля-кебаб (4 шт)",
          description: "Сочный фарш из баранины с луком и специями на шампурах, обжаренный на мангале. Подаётся с лавашом, свежими овощами и соусом.",
          ingredients: "Баранина (фарш), лук, кинза, зира, соль, красный перец, лаваш",
          photos: ["/images/dish-pelmeni.png"], weight: 450, portions: 4, calories: 480, protein: "38.0", fat: "28.0", carbs: "8.0",
          price: "800", cookingTime: 45, cuisineType: "Caucasian", dietaryTags: ["protein-rich"], isAvailable: true, availablePortions: 6,
        },
        {
          cookProfileId: cp8.id, categoryId: mainCat?.id, name: "Стейк Рибай (300г)",
          description: "Сочный стейк рибай из мраморной говядины, приготовленный на гриле до идеальной прожарки Medium. Подаётся с грибным соусом и запечёнными овощами.",
          ingredients: "Мраморная говядина рибай, розмарин, тимьян, чеснок, масло сливочное, грибы, овощи гриль",
          photos: ["/images/dish-stroganoff.png"], weight: 400, portions: 1, calories: 620, protein: "48.0", fat: "38.0", carbs: "8.0",
          price: "1800", cookingTime: 40, cuisineType: "American", dietaryTags: ["protein-rich", "gluten-free"], isAvailable: true, availablePortions: 3,
        },
        {
          cookProfileId: cp8.id, categoryId: appetizerCat?.id ?? mainCat?.id, name: "Ассорти закусок к мангалу",
          description: "Свежий овощной салат, маринованный лук, острый соус, зелень, лаваш — всё что нужно к шашлыку. Порция на 4 человека.",
          ingredients: "Помидоры, огурцы, лук, петрушка, кинза, острый перец, лаваш, соль, уксус",
          photos: ["/images/dish-salad.png"], weight: 400, portions: 4, calories: 120, protein: "3.0", fat: "2.0", carbs: "22.0",
          price: "350", cookingTime: 15, cuisineType: "Caucasian", dietaryTags: ["vegan", "healthy"], isAvailable: true, availablePortions: 10,
        },
      ]);

      const dmitryReviews = [
        { clientId: "reviewer-1", rating: 5, comment: "Шашлык просто огонь! Мясо нежное, маринад волшебный. 24 часа маринования — это чувствуется. Настоящий вкус кавказа." },
        { clientId: "reviewer-6", rating: 5, comment: "Заказывали люля-кебаб на компанию. Все были в восторге! Сочный, ароматный, горячий. Дмитрий — профессионал высшего класса." },
        { clientId: "reviewer-2", rating: 5, comment: "Стейк рибай — это нечто. Medium идеальный, мраморность настоящая. За такое мясо можно всё отдать. Буду постоянным клиентом!" },
        { clientId: "reviewer-4", rating: 4, comment: "Очень вкусно, особенно понравился шашлык из баранины. Единственное — работает только с четверга, жду всю неделю :)" },
        { clientId: "reviewer-5", rating: 5, comment: "Дмитрий знает своё дело. Каждый раз заказываю на выходных — и каждый раз восхищаюсь качеством. Лучший мангальщик Астаны!" },
      ];
      for (const r of dmitryReviews) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: cp8.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
      await db.update(cookProfiles).set({ rating: "4.80" }).where(eq(cookProfiles.id, cp8.id));
    }

    // ── Cook 9: Sofia Ramos — Mediterranean & Healthy ───────────────────────
    const [u9] = await db.insert(users).values({ id: "seed-cook-9", email: "sofia@example.com", firstName: "Sofia", lastName: "Ramos" }).onConflictDoNothing().returning();
    await db.insert(userProfiles).values({ userId: "seed-cook-9", role: "cook" }).onConflictDoNothing();
    const [cp9] = await db.insert(cookProfiles).values({
      userId: "seed-cook-9", displayName: "Sofia Ramos",
      bio: "A nutritionist and Mediterranean food lover from Barcelona. I believe that healthy food should be delicious. All my dishes are calorie-balanced, colourful, and full of flavour — no compromises on taste or nutrition!",
      specialization: "Mediterranean & Healthy Eating", cuisineTypes: ["Spanish", "Mediterranean", "Healthy"],
      experience: "11 years cooking, certified sports nutritionist",
      status: "approved", rating: "4.76", totalOrders: 214, isAvailable: true,
      workingHoursStart: "08:00", workingHoursEnd: "19:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    }).returning();

    if (cp9) {
      await db.insert(dishes).values([
        {
          cookProfileId: cp9.id, categoryId: saladsCat?.id, name: "Greek Salad Bowl",
          description: "A vibrant and fresh Greek salad with juicy tomatoes, cucumbers, Kalamata olives, creamy feta cheese and red onion dressed with extra-virgin olive oil and oregano.",
          ingredients: "Tomatoes, cucumber, feta cheese, Kalamata olives, red onion, olive oil, oregano, lemon",
          photos: ["/images/dish-salad.png"], weight: 380, portions: 1, calories: 280, protein: "12.0", fat: "18.0", carbs: "16.0",
          price: "420", cookingTime: 15, cuisineType: "Mediterranean", dietaryTags: ["vegetarian", "gluten-free", "healthy"], isAvailable: true, availablePortions: 10,
        },
        {
          cookProfileId: cp9.id, categoryId: mainCat?.id, name: "Salmon Fillet with Quinoa",
          description: "Pan-seared Atlantic salmon fillet served with fluffy quinoa, steamed asparagus, cherry tomatoes and a lemon-caper butter sauce. High-protein, low-carb perfection.",
          ingredients: "Atlantic salmon, quinoa, asparagus, cherry tomatoes, capers, lemon, butter, dill",
          photos: ["/images/dish-salad.png"], weight: 400, portions: 1, calories: 480, protein: "42.0", fat: "20.0", carbs: "28.0",
          price: "980", cookingTime: 30, cuisineType: "Mediterranean", dietaryTags: ["healthy", "protein-rich", "gluten-free"], isAvailable: true, availablePortions: 5,
        },
        {
          cookProfileId: cp9.id, categoryId: mainCat?.id, name: "Chicken Pesto Pasta",
          description: "Al dente pasta with homemade basil pesto, grilled chicken strips, cherry tomatoes and toasted pine nuts. Finished with aged Parmigiano-Reggiano.",
          ingredients: "Pasta, chicken breast, basil pesto, cherry tomatoes, pine nuts, Parmigiano-Reggiano, garlic",
          photos: ["/images/dish-stroganoff.png"], weight: 420, portions: 1, calories: 560, protein: "34.0", fat: "18.0", carbs: "58.0",
          price: "680", cookingTime: 35, cuisineType: "Italian", dietaryTags: ["protein-rich"], isAvailable: true, availablePortions: 7,
        },
        {
          cookProfileId: cp9.id, categoryId: breakfastCat?.id ?? mainCat?.id, name: "Açaí Power Bowl",
          description: "A nutritious and beautiful açaí bowl topped with granola, fresh seasonal fruits, honey, chia seeds and coconut flakes. The ultimate healthy breakfast or post-workout meal.",
          ingredients: "Açaí puree, banana, granola, strawberries, blueberries, honey, chia seeds, coconut",
          photos: ["/images/dish-cake.png"], weight: 350, portions: 1, calories: 380, protein: "8.0", fat: "12.0", carbs: "58.0",
          price: "480", cookingTime: 15, cuisineType: "Brazilian", dietaryTags: ["vegan", "healthy", "gluten-free"], isAvailable: true, availablePortions: 8,
        },
        {
          cookProfileId: cp9.id, categoryId: soupsCat?.id, name: "Lentil Cream Soup",
          description: "Velvety smooth red lentil soup with coconut milk, cumin, ginger and turmeric. Served with a drizzle of chili oil and fresh coriander. Warming, filling and 100% plant-based.",
          ingredients: "Red lentils, coconut milk, vegetable broth, cumin, turmeric, ginger, garlic, olive oil, coriander",
          photos: ["/images/dish-borscht.png"], weight: 400, portions: 1, calories: 320, protein: "16.0", fat: "10.0", carbs: "42.0",
          price: "380", cookingTime: 40, cuisineType: "Mediterranean", dietaryTags: ["vegan", "healthy", "gluten-free"], isAvailable: true, availablePortions: 9,
        },
      ]);

      const sofiaReviews = [
        { clientId: "reviewer-3", rating: 5, comment: "The Greek salad is so fresh and perfectly balanced. You can taste the quality of every ingredient. Sofia makes healthy eating feel like a treat!" },
        { clientId: "reviewer-4", rating: 5, comment: "Salmon with quinoa — this is my new weekly staple! Restaurant quality, beautifully presented, healthy and delicious. What more could you want?" },
        { clientId: "reviewer-5", rating: 4, comment: "The pesto pasta is lovely — homemade pesto makes all the difference. Would love even more chicken next time. Otherwise perfect!" },
        { clientId: "reviewer-6", rating: 5, comment: "Açaí bowl was a total game changer for my mornings. Fresh, energising and beautifully presented. Sofia is a health food magician!" },
        { clientId: "reviewer-2", rating: 5, comment: "Lentil soup is unbelievably good for a plant-based dish. Rich, warming and full of flavour. Hard to believe it's vegan. Sofia is incredibly talented!" },
      ];
      for (const r of sofiaReviews) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: cp9.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
      await db.update(cookProfiles).set({ rating: "4.80" }).where(eq(cookProfiles.id, cp9.id));
    }

    // ── Add more reviews to existing cooks ───────────────────────────────────
    const [existingCook1] = await db.select().from(cookProfiles).where(sql`user_id = 'seed-cook-1'`);
    const [existingCook2] = await db.select().from(cookProfiles).where(sql`user_id = 'seed-cook-2'`);
    const [existingCook3] = await db.select().from(cookProfiles).where(sql`user_id = 'seed-cook-3'`);
    const [existingCook4] = await db.select().from(cookProfiles).where(sql`user_id = 'test-cook-4'`);

    if (existingCook1) {
      const reviews1 = [
        { clientId: "reviewer-1", rating: 5, comment: "Борщ как у мамы! Наваристый, тёмно-красный, с густой сметаной. Давно не ел такого домашнего борща. Мария — настоящий мастер!" },
        { clientId: "reviewer-2", rating: 5, comment: "Пельмени ручной лепки — это совсем другая история. Тесто тонкое, начинка сочная. Заказываю уже третий раз, и каждый раз в восторге!" },
        { clientId: "reviewer-3", rating: 4, comment: "Пирожки отличные, тесто пышное и нежное. Взял с мясом и с капустой — оба варианта супер. Немного остыли при доставке, но всё равно вкусно." },
        { clientId: "reviewer-6", rating: 5, comment: "Вкус из детства! Чувствуется, что Мария готовит с любовью. Всё свежее, порции большие, цена разумная. Однозначно рекомендую!" },
      ];
      for (const r of reviews1) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: existingCook1.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
    }

    if (existingCook2) {
      const reviews2 = [
        { clientId: "reviewer-4", rating: 5, comment: "Хачапури по-аджарски — это шедевр! Тесто нежное, сыр тянется, желток идеально жидкий. Настоящая Грузия в каждом кусочке!" },
        { clientId: "reviewer-5", rating: 5, comment: "Жил год в Тбилиси и скучал по грузинской кухне. Георги готовит аутентично — всё точь-в-точь как там. Огромное спасибо!" },
        { clientId: "reviewer-6", rating: 5, comment: "Строганов — объедение. Мясо нежнейшее, соус кремовый. Давно не ел ничего настолько вкусного. Буду заказывать регулярно!" },
        { clientId: "reviewer-1", rating: 5, comment: "Georgis food is something special. Authentic, generous portions, delivered hot. The khachapuri cheese pull is unreal — 10/10!" },
      ];
      for (const r of reviews2) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: existingCook2.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
    }

    if (existingCook3) {
      const reviews3 = [
        { clientId: "reviewer-2", rating: 5, comment: "Салат Цезарь безупречный — курица нежная, заправка домашняя, крутоны хрустящие. Елена знает толк в здоровой и вкусной еде!" },
        { clientId: "reviewer-3", rating: 4, comment: "Шоколадный торт с ягодами — просто чудо. Бельгийский шоколад чувствуется сразу. Взяла на день рождения, все были восхищены!" },
        { clientId: "reviewer-5", rating: 5, comment: "Очень рада, что нашла Елену. Готовит здорово и с любовью к питанию. Для тех кто следит за калориями — идеальный повар!" },
      ];
      for (const r of reviews3) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: existingCook3.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
    }

    if (existingCook4) {
      const reviews4 = [
        { clientId: "reviewer-6", rating: 5, comment: "Бешбармак просто потрясающий! Мясо сочное, тесто тонкое, туздык ароматный. Айгерим готовит как настоящая казахская апа!" },
        { clientId: "reviewer-1", rating: 5, comment: "Баурсаки к чаю — это что-то с чем-то. Пышные, тёплые, воздушные. Взял с мёдом — небо во рту. Теперь заказываю каждые выходные!" },
        { clientId: "reviewer-3", rating: 5, comment: "Сорпа согревает душу. Бульон наваристый, мясо от кости отходит. Истинная казахская кухня в лучших традициях. Рахмет, Айгерим!" },
        { clientId: "reviewer-4", rating: 4, comment: "Куырдак очень вкусный, порция большая. Немного жирноват на мой вкус, но это же традиционное блюдо. Качество на высоте!" },
      ];
      for (const r of reviews4) {
        await db.insert(reviews).values({ clientId: r.clientId, cookProfileId: existingCook4.id, rating: r.rating, comment: r.comment }).onConflictDoNothing();
      }
    }

    console.log("✅ Extended content seeded: 5 new cooks, 22 new dishes, 40+ reviews");
  } catch (error) {
    console.error("Error seeding extended content:", error);
  }
}
