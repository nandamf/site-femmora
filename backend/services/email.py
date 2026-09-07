import os
import resend

resend.api_key = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Femmora <onboarding@resend.dev>")


async def send_password_reset_email(to_email: str, reset_link: str):
    if not resend.api_key:
        print(f"[RESET] (RESEND_API_KEY não configurada) Link para {to_email}: {reset_link}")
        return
    resend.Emails.send({
        "from": EMAIL_FROM,
        "to": [to_email],
        "subject": "Redefinir sua senha — Femmora",
        "html": f"""
            <p>Você pediu para redefinir sua senha na Femmora.</p>
            <p><a href="{reset_link}">Clique aqui para criar uma nova senha</a></p>
            <p>Se não foi você quem pediu, pode ignorar este e-mail — sua senha continua a mesma.</p>
        """,
    })
