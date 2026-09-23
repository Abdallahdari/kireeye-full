import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendContactMessage } from "../services/mailer.service";
import { ContactInput } from "../validators/contact.validators";

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ContactInput;
  sendContactMessage(input);

  res.status(200).json({
    success: true,
    message: "Thanks! Your message has been sent — we'll get back to you soon.",
    data: {},
  });
});
