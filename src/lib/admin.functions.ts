import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const createAdminSchema = z.object({
  user: z.string().trim().min(1).max(80),
  password: z.string().min(6).max(72),
});

function toAdminEmail(user: string) {
  return user.includes("@") ? user : `${user}@banquinha.local`;
}

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createAdminSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) throw new Error("Sem permissão para criar administradores.");

    const email = toAdminEmail(data.user);
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.user },
    });

    if (createError || !created.user) {
      throw new Error(createError?.message ?? "Não foi possível criar o administrador.");
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "admin" }, { onConflict: "user_id,role" });

    if (roleError) throw new Error(roleError.message);

    return { email };
  });