<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ContactFormMail;
use App\Mail\PasswordResetOTP;
use Exception;

class EmailService
{
    /**
     * Send contact form email
     *
     * @param array $data
     * @return bool
     */
    public static function sendContactForm(array $data): bool
    {
        try {
            $supportEmail = config('mail.support_email', config('mail.from.address'));
            Mail::to($supportEmail)->send(new ContactFormMail($data));
            return true;
        } catch (Exception $e) {
            Log::error('Failed to send contact form email', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            return false;
        }
    }

    /**
     * Send password reset OTP email
     *
     * @param string $email
     * @param string $otp
     * @param string $userName
     * @return bool
     */
    public static function sendPasswordResetOTP(string $email, string $otp, string $userName = 'User'): bool
    {
        try {
            Mail::to($email)->send(new PasswordResetOTP($otp, $userName));
            return true;
        } catch (Exception $e) {
            Log::error('Failed to send password reset OTP email', [
                'error' => $e->getMessage(),
                'email' => $email,
            ]);
            return false;
        }
    }

    /**
     * Send email to single recipient
     *
     * @param string|array $to
     * @param string $subject
     * @param string $view
     * @param array $data
     * @param string|null $fromEmail
     * @param string|null $fromName
     * @return bool
     */
    public static function send(
        string|array $to,
        string $subject,
        string $view,
        array $data = [],
        ?string $fromEmail = null,
        ?string $fromName = null
    ): bool {
        try {
            $fromEmail = $fromEmail ?? config('mail.from.address');
            $fromName = $fromName ?? config('mail.from.name');

            Mail::send($view, $data, function ($message) use ($to, $subject, $fromEmail, $fromName) {
                $message->to($to)
                        ->subject($subject)
                        ->from($fromEmail, $fromName);
            });

            return true;
        } catch (Exception $e) {
            Log::error('Failed to send email', [
                'error' => $e->getMessage(),
                'to' => $to,
                'subject' => $subject,
            ]);
            return false;
        }
    }

    /**
     * Send email to multiple recipients
     *
     * @param array $to
     * @param string $subject
     * @param string $view
     * @param array $data
     * @return bool
     */
    public static function sendToMany(array $to, string $subject, string $view, array $data = []): bool
    {
        try {
            Mail::send($view, $data, function ($message) use ($to, $subject) {
                $message->to($to)
                        ->subject($subject)
                        ->from(config('mail.from.address'), config('mail.from.name'));
            });

            return true;
        } catch (Exception $e) {
            Log::error('Failed to send email to multiple recipients', [
                'error' => $e->getMessage(),
                'to' => $to,
                'subject' => $subject,
            ]);
            return false;
        }
    }

    /**
     * Send raw email
     *
     * @param string|array $to
     * @param string $subject
     * @param string $content
     * @return bool
     */
    public static function sendRaw(string|array $to, string $subject, string $content): bool
    {
        try {
            Mail::raw($content, function ($message) use ($to, $subject) {
                $message->to($to)
                        ->subject($subject)
                        ->from(config('mail.from.address'), config('mail.from.name'));
            });

            return true;
        } catch (Exception $e) {
            Log::error('Failed to send raw email', [
                'error' => $e->getMessage(),
                'to' => $to,
                'subject' => $subject,
            ]);
            return false;
        }
    }

    /**
     * Queue email for sending
     *
     * @param string|array $to
     * @param string $subject
     * @param string $view
     * @param array $data
     * @return bool
     */
    public static function queue(string|array $to, string $subject, string $view, array $data = []): bool
    {
        try {
            Mail::queue($view, $data, function ($message) use ($to, $subject) {
                $message->to($to)
                        ->subject($subject)
                        ->from(config('mail.from.address'), config('mail.from.name'));
            });

            return true;
        } catch (Exception $e) {
            Log::error('Failed to queue email', [
                'error' => $e->getMessage(),
                'to' => $to,
                'subject' => $subject,
            ]);
            return false;
        }
    }
}

