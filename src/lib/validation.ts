import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number().positive("Enter an amount"),
  category: z.enum([
    "GROCERIES",
    "UTILITIES",
    "MAINTENANCE",
    "MISC",
    "LOANS",
    "SUBSCRIPTIONS",
    "SAVINGS",
    "INSURANCE",
    "TUITIONS",
    "ALLOWANCES",
  ]),
  note: z.string().optional(),
  occurredAt: z.date().optional(),
});

export const incomeSchema = z.object({
  amount: z.number().positive("Enter an amount"),
  source: z.enum(["SALARY", "INVESTMENT", "OTHER"]),
  note: z.string().optional(),
  occurredAt: z.date().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;