import { db } from "./db";
import { categories, cookProfiles, dishes, users, userProfiles } from "@shared/schema";
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
        ])
        .returning();

      const [seedUser1] = await db
        .insert(users)
        .values({
          id: "seed-cook-1",
          email: "maria@example.com",
          firstName: "Maria",
          lastName: "Ivanova",
          profileImageUrl: null,
        })
        .onConflictDoNothing()
        .returning();

      const [seedUser2] = await db
        .insert(users)
        .values({
          id: "seed-cook-2",
          email: "georgi@example.com",
          firstName: "Georgi",
          lastName: "Kakhadze",
          profileImageUrl: null,
        })
        .onConflictDoNothing()
        .returning();

      const [seedUser3] = await db
        .insert(users)
        .values({
          id: "seed-cook-3",
          email: "elena@example.com",
          firstName: "Elena",
          lastName: "Petrova",
          profileImageUrl: null,
        })
        .onConflictDoNothing()
        .returning();

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

        const [cookProfile1] = await db
          .insert(cookProfiles)
          .values({
            userId: cook1Id,
            displayName: "Maria Ivanova",
            bio: "I have been cooking traditional Russian dishes for over 20 years. My grandmother taught me her secret recipes, and I am delighted to share them with you. Every dish is made with love and the freshest ingredients.",
            specialization: "Russian Cuisine",
            cuisineTypes: ["Russian", "Ukrainian"],
            experience: "20 years of home cooking, culinary courses",
            status: "approved",
            rating: "4.80",
            totalOrders: 156,
            isAvailable: true,
            workingHoursStart: "09:00",
            workingHoursEnd: "20:00",
            workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          })
          .returning();

        const [cookProfile2] = await db
          .insert(cookProfiles)
          .values({
            userId: cook2Id,
            displayName: "Georgi Kakhadze",
            bio: "Authentic Georgian cuisine from a chef born in Tbilisi. I prepare real khachapuri, khinkali, and other Georgian dishes using traditional family recipes and imported spices.",
            specialization: "Georgian Cuisine",
            cuisineTypes: ["Georgian", "Caucasian"],
            experience: "15 years, professional chef training in Tbilisi",
            status: "approved",
            rating: "4.90",
            totalOrders: 203,
            isAvailable: true,
            workingHoursStart: "10:00",
            workingHoursEnd: "21:00",
            workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          })
          .returning();

        const [cookProfile3] = await db
          .insert(cookProfiles)
          .values({
            userId: cook3Id,
            displayName: "Elena Petrova",
            bio: "I specialize in healthy, balanced meals and European cuisine. All dishes are prepared from organic ingredients with attention to nutrition and calorie content.",
            specialization: "Healthy & European Cuisine",
            cuisineTypes: ["Italian", "French", "Healthy"],
            experience: "10 years, nutritionist certification",
            status: "approved",
            rating: "4.70",
            totalOrders: 89,
            isAvailable: true,
            workingHoursStart: "08:00",
            workingHoursEnd: "19:00",
            workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          })
          .returning();

        const soupsCat = seedCategories.find((c) => c.name === "Soups")!;
        const mainCat = seedCategories.find((c) => c.name === "Main Courses")!;
        const saladsCat = seedCategories.find((c) => c.name === "Salads")!;
        const pastryCat = seedCategories.find((c) => c.name === "Pastries")!;
        const dessertsCat = seedCategories.find((c) => c.name === "Desserts")!;

        await db.insert(dishes).values([
          {
            cookProfileId: cookProfile1.id,
            categoryId: soupsCat.id,
            name: "Homemade Borscht",
            description: "Classic Ukrainian borscht with beef, beets, and fresh vegetables. Served with sour cream and garlic rolls. A hearty soup that warms the soul.",
            ingredients: "Beef, beets, cabbage, potatoes, carrots, onions, tomato paste, garlic, dill, sour cream",
            photos: ["/images/dish-borscht.png"],
            weight: 450,
            portions: 1,
            calories: 280,
            protein: "18.5",
            fat: "12.0",
            carbs: "25.0",
            price: "350",
            cookingTime: 90,
            cuisineType: "Russian",
            dietaryTags: ["hearty"],
            isAvailable: true,
            availablePortions: 8,
            storageConditions: "Refrigerate, consume within 48 hours",
            shelfLife: "48 hours",
          },
          {
            cookProfileId: cookProfile1.id,
            categoryId: mainCat.id,
            name: "Homemade Pelmeni",
            description: "Hand-crafted Russian dumplings filled with a juicy mix of beef and pork. Served with sour cream and fresh dill. Made from scratch using a family recipe.",
            ingredients: "Flour, eggs, beef, pork, onions, salt, pepper, sour cream, dill",
            photos: ["/images/dish-pelmeni.png"],
            weight: 400,
            portions: 1,
            calories: 420,
            protein: "22.0",
            fat: "18.0",
            carbs: "38.0",
            price: "450",
            cookingTime: 120,
            cuisineType: "Russian",
            dietaryTags: ["hearty", "protein-rich"],
            isAvailable: true,
            availablePortions: 6,
            storageConditions: "Keep frozen, boil before serving",
            shelfLife: "30 days frozen",
          },
          {
            cookProfileId: cookProfile1.id,
            categoryId: pastryCat.id,
            name: "Golden Pirozhki",
            description: "Fluffy baked pirozhki with various fillings - meat, cabbage, or potato. Perfect as a snack or light meal. Baked to golden perfection.",
            ingredients: "Flour, yeast, milk, eggs, butter, filling (meat/cabbage/potato), onions",
            photos: ["/images/dish-pirozhki.png"],
            weight: 300,
            portions: 4,
            calories: 320,
            protein: "12.0",
            fat: "14.0",
            carbs: "36.0",
            price: "280",
            cookingTime: 60,
            cuisineType: "Russian",
            dietaryTags: ["vegetarian option"],
            isAvailable: true,
            availablePortions: 12,
          },
          {
            cookProfileId: cookProfile2.id,
            categoryId: mainCat.id,
            name: "Adjarian Khachapuri",
            description: "Boat-shaped Georgian cheese bread with a bubbling cheese filling topped with a runny egg and butter. A signature dish of Georgian cuisine.",
            ingredients: "Flour, yeast, suluguni cheese, imeruli cheese, eggs, butter, salt",
            photos: ["/images/dish-khachapuri.png"],
            weight: 350,
            portions: 1,
            calories: 520,
            protein: "20.0",
            fat: "28.0",
            carbs: "42.0",
            price: "480",
            cookingTime: 45,
            cuisineType: "Georgian",
            dietaryTags: ["vegetarian"],
            isAvailable: true,
            availablePortions: 5,
            storageConditions: "Best served hot, reheat in oven",
          },
          {
            cookProfileId: cookProfile2.id,
            categoryId: mainCat.id,
            name: "Beef Stroganoff",
            description: "Tender strips of beef in a rich, creamy mushroom sauce. Served with fresh pasta. A classic dish with a Georgian twist using traditional spices.",
            ingredients: "Beef tenderloin, mushrooms, onions, cream, butter, flour, paprika, fresh pasta",
            photos: ["/images/dish-stroganoff.png"],
            weight: 400,
            portions: 1,
            calories: 480,
            protein: "32.0",
            fat: "24.0",
            carbs: "28.0",
            price: "550",
            cookingTime: 60,
            cuisineType: "Georgian",
            dietaryTags: ["protein-rich"],
            isAvailable: true,
            availablePortions: 4,
          },
          {
            cookProfileId: cookProfile3.id,
            categoryId: saladsCat.id,
            name: "Caesar Salad with Chicken",
            description: "Fresh romaine lettuce with grilled chicken breast, homemade croutons, parmesan, and our signature Caesar dressing. Light yet satisfying.",
            ingredients: "Romaine lettuce, chicken breast, parmesan, croutons, eggs, anchovies, garlic, olive oil, lemon",
            photos: ["/images/dish-salad.png"],
            weight: 350,
            portions: 1,
            calories: 320,
            protein: "28.0",
            fat: "16.0",
            carbs: "18.0",
            price: "380",
            cookingTime: 30,
            cuisineType: "Italian",
            dietaryTags: ["low-carb", "protein-rich"],
            isAvailable: true,
            availablePortions: 7,
            storageConditions: "Consume immediately, dressing served separately",
          },
          {
            cookProfileId: cookProfile3.id,
            categoryId: dessertsCat.id,
            name: "Chocolate Berry Cake",
            description: "Rich chocolate cake layered with chocolate ganache and topped with fresh seasonal berries. Made with premium Belgian chocolate.",
            ingredients: "Dark chocolate, butter, eggs, flour, sugar, cream, fresh berries, cocoa powder",
            photos: ["/images/dish-cake.png"],
            weight: 250,
            portions: 1,
            calories: 380,
            protein: "6.0",
            fat: "22.0",
            carbs: "40.0",
            price: "420",
            cookingTime: 90,
            cuisineType: "French",
            dietaryTags: ["dessert"],
            isAvailable: true,
            availablePortions: 3,
            storageConditions: "Refrigerate, consume within 24 hours",
          },
        ]);

        console.log("Database seeded successfully!");
      }
    }

    await seedTestUsers();
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function seedTestUsers() {
  try {
    // Test Client
    await db.insert(users).values({
      id: "test-client-1",
      email: "client@localtaste.test",
      firstName: "Алия",
      lastName: "Сейткали",
      profileImageUrl: null,
    }).onConflictDoNothing();

    await db.insert(userProfiles).values({
      userId: "test-client-1",
      role: "client",
      phone: "+77001112233",
      address: "ул. Кенесары 40, Астана",
    }).onConflictDoNothing();

    // Test Cook (Kazakh cuisine)
    await db.insert(users).values({
      id: "test-cook-4",
      email: "cook@localtaste.test",
      firstName: "Айгерим",
      lastName: "Нурланова",
      profileImageUrl: null,
    }).onConflictDoNothing();

    await db.insert(userProfiles).values({
      userId: "test-cook-4",
      role: "cook",
      phone: "+77012223344",
    }).onConflictDoNothing();

    const existingCookProfile = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cookProfiles)
      .where(sql`user_id = 'test-cook-4'`);

    if (!existingCookProfile[0]?.count || existingCookProfile[0].count === 0) {
      const [cookProfile4] = await db.insert(cookProfiles).values({
        userId: "test-cook-4",
        displayName: "Айгерим Нурланова",
        bio: "Готовлю домашние казахские блюда с душой. Бешбармак, баурсаки, куырдак — всё по рецептам моей бабушки из Семея.",
        specialization: "Kazakh Cuisine",
        cuisineTypes: ["Kazakh", "Central Asian"],
        experience: "12 лет домашней готовки, победитель конкурса 'Лучший домашний повар Астаны'",
        status: "approved",
        rating: "4.85",
        totalOrders: 127,
        isAvailable: true,
        workingHoursStart: "09:00",
        workingHoursEnd: "20:00",
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      }).returning();

      const [mainCat] = await db
        .select()
        .from(categories)
        .where(sql`name = 'Main Courses'`);
      const [soupsCat] = await db
        .select()
        .from(categories)
        .where(sql`name = 'Soups'`);
      const [pastryCat] = await db
        .select()
        .from(categories)
        .where(sql`name = 'Pastries'`);

      if (cookProfile4 && mainCat && soupsCat && pastryCat) {
        await db.insert(dishes).values([
          {
            cookProfileId: cookProfile4.id,
            categoryId: mainCat.id,
            name: "Бешбармак",
            description: "Традиционное казахское блюдо: нежная отварная конина или баранина на тонких листах теста с ароматным луковым соусом (туздук).",
            ingredients: "Баранина, мука, яйца, лук, картофель, соль, перец, зелень",
            photos: ["/images/dish-pelmeni.png"],
            weight: 500,
            portions: 1,
            calories: 550,
            protein: "35.0",
            fat: "28.0",
            carbs: "38.0",
            price: "650",
            cookingTime: 120,
            cuisineType: "Kazakh",
            dietaryTags: ["hearty", "protein-rich"],
            isAvailable: true,
            availablePortions: 5,
          },
          {
            cookProfileId: cookProfile4.id,
            categoryId: mainCat.id,
            name: "Куырдак",
            description: "Жаркое из мяса и субпродуктов с картофелем и луком. Традиционное казахское блюдо, сытное и ароматное.",
            ingredients: "Баранина, печень, сердце, картофель, лук, масло, специи",
            photos: ["/images/dish-stroganoff.png"],
            weight: 400,
            portions: 1,
            calories: 480,
            protein: "30.0",
            fat: "25.0",
            carbs: "30.0",
            price: "550",
            cookingTime: 60,
            cuisineType: "Kazakh",
            dietaryTags: ["hearty"],
            isAvailable: true,
            availablePortions: 6,
          },
          {
            cookProfileId: cookProfile4.id,
            categoryId: pastryCat.id,
            name: "Баурсаки",
            description: "Пышные жареные кусочки теста — традиционное казахское угощение. Подаются с мёдом или как гарнир к мясным блюдам.",
            ingredients: "Мука, молоко, яйца, дрожжи, сахар, масло для жарки",
            photos: ["/images/dish-pirozhki.png"],
            weight: 250,
            portions: 8,
            calories: 300,
            protein: "8.0",
            fat: "12.0",
            carbs: "42.0",
            price: "200",
            cookingTime: 40,
            cuisineType: "Kazakh",
            dietaryTags: ["vegetarian"],
            isAvailable: true,
            availablePortions: 10,
          },
          {
            cookProfileId: cookProfile4.id,
            categoryId: soupsCat.id,
            name: "Сорпа",
            description: "Наваристый бульон из баранины с овощами. Традиционный казахский суп, который подаётся с мясом и зеленью.",
            ingredients: "Баранина на кости, морковь, лук, картофель, зелень, соль",
            photos: ["/images/dish-borscht.png"],
            weight: 450,
            portions: 1,
            calories: 250,
            protein: "20.0",
            fat: "14.0",
            carbs: "12.0",
            price: "400",
            cookingTime: 90,
            cuisineType: "Kazakh",
            dietaryTags: ["hearty"],
            isAvailable: true,
            availablePortions: 7,
          },
        ]);
      }
    }

    // Test Moderator
    await db.insert(users).values({
      id: "test-moderator-1",
      email: "moderator@localtaste.test",
      firstName: "Данияр",
      lastName: "Модератов",
      profileImageUrl: null,
    }).onConflictDoNothing();

    await db.insert(userProfiles).values({
      userId: "test-moderator-1",
      role: "moderator",
      phone: "+77023334455",
    }).onConflictDoNothing();

    // Test Admin
    await db.insert(users).values({
      id: "test-admin-1",
      email: "admin@localtaste.test",
      firstName: "Администратор",
      lastName: "Local Taste",
      profileImageUrl: null,
    }).onConflictDoNothing();

    await db.insert(userProfiles).values({
      userId: "test-admin-1",
      role: "admin",
      phone: "+77034445566",
    }).onConflictDoNothing();

    // Test Support
    await db.insert(users).values({
      id: "test-support-1",
      email: "support@localtaste.test",
      firstName: "Сервис",
      lastName: "Поддержки",
      profileImageUrl: null,
    }).onConflictDoNothing();

    await db.insert(userProfiles).values({
      userId: "test-support-1",
      role: "support",
      phone: "+77045556677",
    }).onConflictDoNothing();

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
