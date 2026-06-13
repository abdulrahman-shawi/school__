import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const userSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const studentSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  phone: z.string().optional(),
  address: z.string().optional(),
  admissionNo: z.string().min(1, "رقم القيد مطلوب"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  bloodGroup: z.string().optional(),
  previousSchool: z.string().optional(),
  classId: z.string().optional(),
  parentId: z.string().optional(),
});

export const teacherSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  phone: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.coerce.number().optional(),
  salary: z.coerce.number().optional(),
});

export const parentSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  phone: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  relation: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const classSchema = z.object({
  name: z.string().min(1, "اسم الصف مطلوب"),
  section: z.string().optional(),
  capacity: z.coerce.number().optional(),
  academicYearId: z.string().min(1, "السنة الدراسية مطلوبة"),
  classTeacherId: z.string().optional(),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "اسم المادة مطلوب"),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const academicYearSchema = z.object({
  name: z.string().min(1, "اسم السنة الدراسية مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  isCurrent: z.boolean().default(false),
});

export const examSchema = z.object({
  name: z.string().min(1, "اسم الامتحان مطلوب"),
  type: z.string().min(1, "نوع الامتحان مطلوب"),
  termId: z.string().min(1, "الفصل الدراسي مطلوب"),
  academicYearId: z.string().min(1, "السنة الدراسية مطلوبة"),
  classId: z.string().min(1, "الصف مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().optional(),
});

export const examScheduleSchema = z.object({
  examId: z.string().min(1, "الامتحان مطلوب"),
  classId: z.string().min(1, "الصف مطلوب"),
  subjectId: z.string().min(1, "المادة مطلوبة"),
  examDate: z.string().min(1, "تاريخ الامتحان مطلوب"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  roomNo: z.string().optional(),
  maxMarks: z.coerce.number().default(100),
  passMarks: z.coerce.number().default(35),
  teacherId: z.string().optional(),
});

export const markSchema = z.object({
  studentId: z.string().min(1, "الطالب مطلوب"),
  examScheduleId: z.string().min(1, "جدول الامتحان مطلوب"),
  marksObtained: z.coerce.number().min(0, "الدرجة يجب أن تكون 0 أو أكثر"),
});

export const attendanceSchema = z.object({
  studentId: z.string().min(1, "الطالب مطلوب"),
  classId: z.string().min(1, "الصف مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  remarks: z.string().optional(),
});

export const homeworkSchema = z.object({
  classId: z.string().min(1, "الصف مطلوب"),
  subjectId: z.string().min(1, "المادة مطلوبة"),
  title: z.string().min(1, "عنوان الواجب مطلوب"),
  description: z.string().optional(),
  maxMarks: z.coerce.number().optional(),
  dueDate: z.string().min(1, "تاريخ التسليم مطلوب"),
});

export const feeTypeSchema = z.object({
  name: z.string().min(1, "اسم الرسم مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون موجباً"),
  frequency: z.string().optional(),
});

export const feeCollectionSchema = z.object({
  studentId: z.string().min(1, "الطالب مطلوب"),
  classId: z.string().min(1, "الصف مطلوب"),
  feeTypeId: z.string().min(1, "نوع الرسم مطلوب"),
  academicYearId: z.string().min(1, "السنة الدراسية مطلوبة"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون موجباً"),
  dueDate: z.string().min(1, "تاريخ الاستحقاق مطلوب"),
});

export const noticeSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  message: z.string().min(1, "المحتوى مطلوب"),
  audience: z.string().min(1, "الجمهور المستهدف مطلوب"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  expiresAt: z.string().optional(),
});

export const messageSchema = z.object({
  receiverId: z.string().min(1, "المستلم مطلوب"),
  classId: z.string().min(1, "الصف مطلوب"),
  subjectId: z.string().optional(),
  content: z.string().min(1, "المحتوى مطلوب"),
});

export const eventSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().optional(),
  audience: z.string().default("ALL"),
});

export const leaveSchema = z.object({
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  reason: z.string().min(1, "السبب مطلوب"),
});

export const payrollSchema = z.object({
  teacherId: z.string().min(1, "المعلم مطلوب"),
  month: z.string().min(1, "الشهر مطلوب"),
  basicSalary: z.coerce.number().min(0, "الراتب يجب أن يكون موجباً"),
  deductions: z.coerce.number().default(0),
  bonuses: z.coerce.number().default(0),
});

export const behaviorSchema = z.object({
  studentId: z.string().min(1, "الطالب مطلوب"),
  type: z.enum(["POSITIVE", "NEGATIVE"]),
  category: z.string().min(1, "التصنيف مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  points: z.coerce.number().default(0),
});

export const settingSchema = z.object({
  key: z.string().min(1, "المفتاح مطلوب"),
  value: z.string().min(1, "القيمة مطلوبة"),
});
