import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcryptjs from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 بدء إضافة البيانات التجريبية...");

  // 1. المسؤول
  const adminPassword = await bcryptjs.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      name: "المسؤول الرئيسي",
      email: "admin@school.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "0500000000",
      isActive: true,
      admin: { create: {} },
    },
  });
  console.log("✅ المسؤول:", admin.email);

  // 2. السنة الدراسية
  const year = await prisma.academicYear.upsert({
    where: { name: "2025-2026" },
    update: {},
    create: {
      name: "2025-2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });
  console.log("✅ السنة الدراسية:", year.name);

  // 3. الفصل الدراسي
  const term1 = await prisma.term.upsert({
    where: { academicYearId_name: { academicYearId: year.id, name: "الفصل الأول" } },
    update: {},
    create: {
      name: "الفصل الأول",
      academicYearId: year.id,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-01-15"),
      isCurrent: true,
    },
  });
  console.log("✅ الفصل الدراسي:", term1.name);

  // 4. مواد دراسية
  const subjectsData = [
    { name: "الرياضيات", code: "MATH" },
    { name: "اللغة العربية", code: "ARAB" },
    { name: "اللغة الإنجليزية", code: "ENG" },
    { name: "العلوم", code: "SCI" },
    { name: "الدراسات الاجتماعية", code: "SOC" },
    { name: "التربية الإسلامية", code: "ISL" },
    { name: "الحاسب الآلي", code: "COMP" },
  ];

  for (const s of subjectsData) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: { name: s.name, code: s.code, isActive: true },
    });
  }
  console.log("✅ المواد الدراسية:", subjectsData.length);

  // 5. معلمين
  const teacherPassword = await bcryptjs.hash("teacher123", 10);
  const teachersData = [
    { name: "أحمد محمد", email: "ahmed@school.com", specialization: "رياضيات" },
    { name: "خالد عبدالله", email: "khaled@school.com", specialization: "عربي" },
    { name: "سعيد علي", email: "saeed@school.com", specialization: "إنجليزي" },
    { name: "عمر فاروق", email: "omar@school.com", specialization: "علوم" },
    { name: "فاطمة الزهراء", email: "fatima@school.com", specialization: "حاسب" },
  ];

  const createdTeachers = [];
  for (const t of teachersData) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        password: teacherPassword,
        role: "TEACHER",
        phone: "05" + Math.floor(10000000 + Math.random() * 89999999),
        isActive: true,
        teacher: {
          create: {
            specialization: t.specialization,
            experience: Math.floor(Math.random() * 15) + 1,
            salary: Math.floor(Math.random() * 5000) + 8000,
          },
        },
      },
      include: { teacher: true },
    });
    createdTeachers.push(user);
  }
  console.log("✅ المعلمون:", createdTeachers.length);

  // 6. صفوف دراسية
  const classesData = [
    { name: "الأول الابتدائي", section: "أ" },
    { name: "الأول الابتدائي", section: "ب" },
    { name: "الثاني الابتدائي", section: "أ" },
    { name: "الثالث الابتدائي", section: "أ" },
    { name: "الرابع الابتدائي", section: "أ" },
    { name: "الخامس الابتدائي", section: "أ" },
    { name: "السادس الابتدائي", section: "أ" },
    { name: "الأول المتوسط", section: "أ" },
    { name: "الثاني المتوسط", section: "أ" },
    { name: "الثالث المتوسط", section: "أ" },
  ];

  const createdClasses = [];
  for (let i = 0; i < classesData.length; i++) {
    const c = await prisma.class.upsert({
      where: { id: `class-seed-${i}` },
      update: {},
      create: {
        name: classesData[i].name,
        section: classesData[i].section,
        capacity: 30,
        academicYearId: year.id,
        classTeacherId: createdTeachers[i % createdTeachers.length].teacher?.id,
      },
    });
    createdClasses.push(c);
  }
  console.log("✅ الصفوف:", createdClasses.length);

  // 7. أولياء أمور
  const parentPassword = await bcryptjs.hash("parent123", 10);
  const parentsData = [
    { name: "محمد عبدالرحمن", email: "parent1@school.com", relation: "أب" },
    { name: "عبدالله السالم", email: "parent2@school.com", relation: "أب" },
    { name: "نورة الفهد", email: "parent3@school.com", relation: "أم" },
    { name: "سلطان المالك", email: "parent4@school.com", relation: "أب" },
    { name: "ريم الشامي", email: "parent5@school.com", relation: "أم" },
  ];

  const createdParents = [];
  for (const p of parentsData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        email: p.email,
        password: parentPassword,
        role: "PARENT",
        phone: "05" + Math.floor(10000000 + Math.random() * 89999999),
        isActive: true,
        parent: {
          create: {
            relation: p.relation,
            occupation: "موظف حكومي",
          },
        },
      },
      include: { parent: true },
    });
    createdParents.push(user);
  }
  console.log("✅ أولياء الأمور:", createdParents.length);

  // 8. طلاب
  const studentPassword = await bcryptjs.hash("student123", 10);
  const studentNames = [
    "عبدالرحمن أحمد", "خالد سعيد", "فهد محمد", "نايف عبدالله",
    "تركي علي", "سلطان خالد", "منصور فهد", "بدر نايف",
    "ماجد تركي", "فيصل منصور", "عبدالعزيز بدر", "سعد ماجد",
    "يوسف فيصل", "إبراهيم عبدالعزيز", "نواف سعد",
  ];

  const createdStudents = [];
  for (let i = 0; i < studentNames.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: `student${i + 1}@school.com` },
      update: {},
      create: {
        name: studentNames[i],
        email: `student${i + 1}@school.com`,
        password: studentPassword,
        role: "STUDENT",
        phone: "05" + Math.floor(10000000 + Math.random() * 89999999),
        isActive: true,
        student: {
          create: {
            admissionNo: `2025${String(i + 1).padStart(4, "0")}`,
            dateOfBirth: new Date(2010 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: Math.random() > 0.3 ? "MALE" : "FEMALE",
            bloodGroup: ["A+", "B+", "O+", "AB+"][Math.floor(Math.random() * 4)],
            classId: createdClasses[i % createdClasses.length].id,
            parentId: createdParents[i % createdParents.length].parent?.id,
          },
        },
      },
      include: { student: true },
    });
    createdStudents.push(user);
  }
  console.log("✅ الطلاب:", createdStudents.length);

  // 9. أنواع رسوم
  const feeTypesData = [
    { name: "الرسوم الدراسية", amount: 5000, frequency: "سنوي" },
    { name: "المواصلات", amount: 1200, frequency: "شهري" },
    { name: "الكتب", amount: 800, frequency: "سنوي" },
    { name: "الزي المدرسي", amount: 400, frequency: "سنوي" },
    { name: "النشاطات", amount: 300, frequency: "سنوي" },
  ];

  for (const ft of feeTypesData) {
    const existing = await prisma.feeType.findFirst({ where: { name: ft.name } });
    if (!existing) {
      await prisma.feeType.create({ data: ft });
    }
  }
  console.log("✅ أنواع الرسوم:", feeTypesData.length);

  // 10. إعلانات
  const noticesData = [
    { title: "بدء العام الدراسي الجديد", message: "نرحب بجميع الطلاب والمعلمين في العام الدراسي 2025-2026", audience: "ALL", priority: "HIGH" },
    { title: "اجتماع أولياء الأمور", message: "سيتم عقد اجتماع لأولياء الأمور يوم الخميس القادم", audience: "PARENT", priority: "NORMAL" },
    { title: "امتحانات منتصف الفصل", message: "تبدأ امتحانات منتصف الفصل الدراسي الأول الأسبوع القادم", audience: "STUDENT", priority: "URGENT" },
  ];

  for (const n of noticesData) {
    await prisma.noticeBoard.create({
      data: {
        title: n.title,
        message: n.message,
        audience: n.audience,
        priority: n.priority as any,
        createdBy: admin.id,
      },
    });
  }
  console.log("✅ الإعلانات:", noticesData.length);

  // 11. إعدادات النظام
  const settingsData = [
    { key: "SCHOOL_NAME", value: "مدارس العلم النموذجية" },
    { key: "SCHOOL_PHONE", value: "013-1234567" },
    { key: "SCHOOL_EMAIL", value: "info@school.com" },
    { key: "SCHOOL_ADDRESS", value: "الرياض، المملكة العربية السعودية" },
    { key: "CURRENCY", value: "ر.س" },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ إعدادات النظام:", settingsData.length);

  console.log("\n🎉 تمت إضافة جميع البيانات التجريبية بنجاح!");
  console.log("\n🔑 بيانات الدخول:");
  console.log("   المسؤول: admin@school.com / admin123");
  console.log("   معلم: ahmed@school.com / teacher123");
  console.log("   ولي أمر: parent1@school.com / parent123");
  console.log("   طالب: student1@school.com / student123");
}

main()
  .catch((e) => {
    console.error("❌ خطأ في Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
