<?php

namespace App\Helpers;

use App\Services\EmailService;

if (!function_exists('send_email')) {
    /**
     * Send email helper function
     *
     * @param string|array $to
     * @param string $subject
     * @param string $view
     * @param array $data
     * @return bool
     */
    function send_email(string|array $to, string $subject, string $view, array $data = []): bool
    {
        return EmailService::send($to, $subject, $view, $data);
    }
}

if (!function_exists('send_contact_form_email')) {
    /**
     * Send contact form email helper
     *
     * @param array $data
     * @return bool
     */
    function send_contact_form_email(array $data): bool
    {
        return EmailService::sendContactForm($data);
    }
}

if (!function_exists('send_password_reset_otp')) {
    /**
     * Send password reset OTP helper
     *
     * @param string $email
     * @param string $otp
     * @param string $userName
     * @return bool
     */
    function send_password_reset_otp(string $email, string $otp, string $userName = 'User'): bool
    {
        return EmailService::sendPasswordResetOTP($email, $otp, $userName);
    }
}

