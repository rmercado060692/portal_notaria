from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class ForgotPasswordThrottle(AnonRateThrottle):
    scope = 'forgot_password'


class ResetPasswordThrottle(AnonRateThrottle):
    scope = 'reset_password'


class RefreshTokenThrottle(AnonRateThrottle):
    scope = 'token_refresh'


class LogoutThrottle(UserRateThrottle):
    scope = 'logout'
