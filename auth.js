document.addEventListener('DOMContentLoaded', () => {
    if (getCookie('rpfa_email')) {
        window.location.href = 'account.html';
        return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageEl = document.getElementById('authMessage');

    document.getElementById('signInBtn').addEventListener('click', handleSignIn);
    document.getElementById('signUpBtn').addEventListener('click', handleSignUp);

    function showMessage(text) {
        messageEl.textContent = text;
    }

    async function handleSignIn() {
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        if (!email || !password) return showMessage('Заполни email и пароль');

        const passwordHash = await sha256(password);
        const { data: user, error } = await sb
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error) return showMessage('Ошибка: ' + error.message);
        if (!user) return showMessage('Аккаунт с таким email не найден');
        if (user.password_hash !== passwordHash) return showMessage('Неверный пароль');

        setCookie('rpfa_email', email, 30);
        window.location.href = 'account.html';
    }

    async function handleSignUp() {
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        if (!email || !password) return showMessage('Заполни email и пароль');
        if (password.length < 4) return showMessage('Пароль слишком короткий');

        const { data: existing, error: checkError } = await sb
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (checkError) return showMessage('Ошибка: ' + checkError.message);
        if (existing) return showMessage('Аккаунт с таким email уже существует');

        const passwordHash = await sha256(password);
        const { error: insertError } = await sb
            .from('users')
            .insert({ email, password_hash: passwordHash, license: 'free' });

        if (insertError) return showMessage('Ошибка регистрации: ' + insertError.message);

        setCookie('rpfa_email', email, 30);
        window.location.href = 'account.html';
    }
});
