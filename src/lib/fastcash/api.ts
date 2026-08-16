/**
 * Fast Cash data layer.
 *
 * The original app talked to an Express server through `api('/api/...')`.
 * This module keeps that call shape but reads and writes through Lovable Cloud
 * so every page component keeps working unchanged.
 */
import { supabase } from "@/integrations/supabase/client";

type Options = { method?: string; body?: string; headers?: Record<string, string> };

export type FastCashUser = {
  id: string;
  email: string | null;
  fullName: string;
  playerId: string | null;
  role: "ADMIN" | "USER";
};

const fail = (message: string, status = 400) => {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  throw err;
};

const parse = (options: Options) => (options.body ? JSON.parse(options.body) : {});

const camelTx = (row: Record<string, unknown>) => ({
  id: row["reference"] as string,
  rowId: row["id"] as string,
  userId: row["user_id"] as string | null,
  type: row["type"] as string,
  status: row["status"] as string,
  amount: Number(row["amount"]),
  playerId: row["player_id"] as string | null,
  paymentMethod: row["payment_method"] as string | null,
  receiptReference: row["receipt_reference"] as string | null,
  receiptImage: row["receipt_image"] as string | null,
  securityCode: row["security_code"] as string | null,
  fullName: row["full_name"] as string | null,
  bank: row["bank"] as string | null,
  accountNumber: row["account_number"] as string | null,
  contactNumber: row["contact_number"] as string | null,
  createdAt: row["created_at"] as string,
});

const camelAccount = (row: Record<string, unknown>) => ({
  id: row["id"] as string,
  name: row["name"] as string,
  number: row["number"] as string,
  icon: row["icon"] as string,
  type: row["type"] as string,
  active: row["active"] as boolean,
});

async function currentUser(): Promise<FastCashUser | null> {
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  if (!authUser) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name, player_id, email").eq("id", authUser.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", authUser.id),
  ]);

  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
  return {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? null,
    fullName: profile?.full_name || (authUser.email ?? "Player"),
    playerId: profile?.player_id ?? null,
    role: isAdmin ? "ADMIN" : "USER",
  };
}

async function settings() {
  const { data } = await supabase
    .from("app_settings")
    .select("whatsapp_number, min_transaction, max_transaction, promo_code")
    .eq("id", 1)
    .maybeSingle();
  return {
    whatsappNumber: data?.whatsapp_number ?? "+94765865387",
    minTransaction: data?.min_transaction ?? 1000,
    maxTransaction: data?.max_transaction ?? 500000,
    promoCode: data?.promo_code ?? "VGSL",
  };
}

async function submitTransaction(type: "DEPOSIT" | "WITHDRAWAL", body: Record<string, string>) {
  const amount = Number(body["amount"]);
  if (!amount || Number.isNaN(amount)) fail("Please enter a valid amount.");
  if (!body["playerId"]) fail("Please enter your Player ID.");

  const config = await settings();
  if (amount < config.minTransaction || amount > config.maxTransaction) {
    fail(`Amount must be between LKR ${config.minTransaction.toLocaleString()} and LKR ${config.maxTransaction.toLocaleString()}.`);
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const reference = `TXN${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const payload = {
    reference,
    user_id: userId,
    type,
    amount,
    player_id: body["playerId"] ?? null,
    payment_method: body["paymentMethod"] ?? null,
    receipt_reference: body["receiptReference"] ?? null,
    receipt_image: body["receiptImage"] ?? null,
    security_code: body["securityCode"] ?? null,
    full_name: body["fullName"] ?? null,
    bank: body["bank"] ?? null,
    account_number: body["accountNumber"] ?? null,
    contact_number: body["contactNumber"] ?? null,
  };

  // Guests cannot read rows back (no anonymous read access), so never ask for a
  // representation when there is no session — that read is what RLS rejects.
  if (!userId) {
    const { error } = await supabase.from("transactions").insert(payload);
    if (error) fail(error.message);
    return {
      transaction: camelTx({
        ...payload,
        id: reference,
        status: "PENDING",
        created_at: new Date().toISOString(),
      } as Record<string, unknown>),
    };
  }

  const { data, error } = await supabase.from("transactions").insert(payload).select().maybeSingle();
  if (error || !data) fail(error?.message ?? "Could not submit your request.");
  return { transaction: camelTx(data as Record<string, unknown>) };
}


function supportReply(message: string) {
  const text = message.toLowerCase();
  if (text.includes("deposit")) {
    return "For a deposit: transfer to one of the agent accounts on the Deposit page, then submit the request with your Player ID, amount and receipt. An agent confirms it after review.";
  }
  if (text.includes("withdraw")) {
    return "For a withdrawal: choose Cash in the 1xBet app (City: Walasmulla, Street: Beliatta Road 24/7), then submit the security code and your bank details on the Withdraw page.";
  }
  if (text.includes("player") || text.includes("id")) {
    return "Your Player ID is shown in the 1xBet app under your account or profile section. It is the numeric ID used for every deposit and withdrawal.";
  }
  if (text.includes("time") || text.includes("long")) {
    return "Requests are reviewed by an agent during service hours. Sending the details on WhatsApp after submitting speeds up the review.";
  }
  return "I can help with deposit and withdrawal requests, finding a Player ID, support and responsible gambling. Account-specific information requires sign-in.";
}

export async function api(url: string, options: Options = {}): Promise<any> {
  const method = (options.method ?? "GET").toUpperCase();

  if (url === "/api/config" && method === "GET") return settings();

  if (url === "/api/auth/me") return { user: await currentUser() };

  if (url === "/api/auth/login" && method === "POST") {
    const body = parse(options);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(body.email ?? "").trim(),
      password: String(body.password ?? ""),
    });
    if (error) fail("Email or password is incorrect.", 401);
    return { user: await currentUser() };
  }

  if (url === "/api/auth/register" && method === "POST") {
    const body = parse(options);
    const email = String(body.email ?? "").trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(body.password ?? ""),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: body.fullName ?? "", player_id: body.playerId ?? null },
      },
    });
    if (error) fail(error.message);
    // With email confirmation on, signUp returns no session; the profile write
    // would then be rejected. Only write it when the user is actually signed in.
    if (data.user && data.session) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: String(body.fullName ?? ""),
        player_id: body.playerId ? String(body.playerId) : null,
        email,
      });
    }
    if (!data.session) {
      return { user: null, pendingConfirmation: true, message: "Check your email to confirm your account, then sign in." };
    }
    return { user: await currentUser() };
  }



  if (url === "/api/auth/logout" && method === "POST") {
    await supabase.auth.signOut();
    return {};
  }

  if (url === "/api/transactions" && method === "GET") {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return { transactions: (data ?? []).map((row) => camelTx(row as Record<string, unknown>)) };
  }

  if (url === "/api/deposits" && method === "POST") return submitTransaction("DEPOSIT", parse(options));
  if (url === "/api/withdrawals" && method === "POST") return submitTransaction("WITHDRAWAL", parse(options));

  if (url === "/api/bank-details" && method === "GET") {
    const { data } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("sort_order", { ascending: true });
    return { agentBankDetails: (data ?? []).map((row) => camelAccount(row as Record<string, unknown>)) };
  }

  if (url === "/api/support/chat" && method === "POST") {
    const body = parse(options);
    const messages: { role: string; content: string }[] = body.messages ?? [];
    const last = [...messages].reverse().find((m) => m.role === "user");
    return { reply: supportReply(last?.content ?? "") };
  }

  if (url === "/api/admin/overview" && method === "GET") {
    const user = await currentUser();
    if (user?.role !== "ADMIN") fail("Administrator access required.", 403);
    const [txRes, accRes, profileRes, config] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("bank_accounts").select("*").order("sort_order", { ascending: true }),
      supabase.from("profiles").select("id, full_name, player_id, email, created_at"),
      settings(),
    ]);
    const transactions = (txRes.data ?? []).map((row) => camelTx(row as Record<string, unknown>));
    return {
      stats: {
        totalUsers: (profileRes.data ?? []).length,
        totalTransactions: transactions.length,
        pending: transactions.filter((tx) => tx.status === "PENDING").length,
        completed: transactions.filter((tx) => tx.status === "COMPLETED" || tx.status === "APPROVED").length,
        deposits: transactions.filter((tx) => tx.type === "DEPOSIT").length,
        withdrawals: transactions.filter((tx) => tx.type === "WITHDRAWAL").length,
      },
      transactions,
      agentBankDetails: (accRes.data ?? []).map((row) => camelAccount(row as Record<string, unknown>)),
      systemSettings: config,
      users: (profileRes.data ?? []).map((row: Record<string, unknown>) => ({
        id: row["id"],
        fullName: row["full_name"],
        playerId: row["player_id"],
        email: row["email"],
        createdAt: row["created_at"],
      })),
    };
  }

  if (url === "/api/admin/bank-details" && method === "GET") {
    const [{ data }, config] = await Promise.all([
      supabase.from("bank_accounts").select("*").order("sort_order", { ascending: true }),
      settings(),
    ]);
    return {
      agentBankDetails: (data ?? []).map((row) => camelAccount(row as Record<string, unknown>)),
      systemSettings: config,
    };
  }

  if (url === "/api/admin/bank-details" && (method === "PUT" || method === "POST")) {
    const body = parse(options);
    const accounts: ReturnType<typeof camelAccount>[] = body.agentBankDetails ?? [];
    const rows = accounts.map((acc, index) => ({
      id: acc.id,
      name: acc.name,
      number: acc.number,
      icon: acc.icon || "🏦",
      type: acc.type || "BANK",
      active: acc.active !== false,
      sort_order: index + 1,
    }));
    if (rows.length) {
      const { error } = await supabase.from("bank_accounts").upsert(rows);
      if (error) fail(error.message);
    }
    if (body.systemSettings) {
      const { error } = await supabase
        .from("app_settings")
        .update({
          whatsapp_number: body.systemSettings.whatsappNumber,
          min_transaction: Number(body.systemSettings.minTransaction),
          max_transaction: Number(body.systemSettings.maxTransaction),
          promo_code: body.systemSettings.promoCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) fail(error.message);
    }
    return api("/api/admin/bank-details");
  }

  if (url.startsWith("/api/admin/bank-details/") && method === "DELETE") {
    const id = url.split("/").pop()!;
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) fail(error.message);
    return api("/api/admin/bank-details");
  }

  if (url.startsWith("/api/admin/transactions/") && method === "PATCH") {
    const reference = url.split("/").pop()!;
    const body = parse(options);
    const { data, error } = await supabase
      .from("transactions")
      .update({ status: String(body.status) })
      .eq("reference", reference)
      .select()
      .maybeSingle();
    if (error || !data) fail(error?.message ?? "Could not update this request.");
    return { transaction: camelTx(data as Record<string, unknown>) };
  }

  if (url === "/api/promotions" && method === "GET") return { promotions: [] };

  return fail("This service is not available.", 503);
}
