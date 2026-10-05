export type Attachment = { url: string; pathname: string; filename: string; size: number };

export type Recipient = {
  id: string;
  email: string;
  vars: Record<string, string>; // name, company, etc. ("email" is added automatically)
  attachments: Attachment[];
  useCustom: boolean;
  subject: string;
  body: string;
};

export type SendResult = { email: string; ok: boolean; id?: string; error?: string };
