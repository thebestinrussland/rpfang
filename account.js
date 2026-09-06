document.addEventListener('DOMContentLoaded', async () => {
    const email = getCookie('rpfa_email');
    if (!email) {
        window.location.href = 'index.html';
        return;
    }

    const { data: user, error } = await sb
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error || !user) {
        deleteCookie('rpfa_email');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('accountEmail').textContent = 'Account - ' + user.email;

    const licenseNames = { free: 'Free', pro: 'Pro', max: 'Max' };
    let license = user.license || 'free';
    let expiresAt = user.license_expires_at ? new Date(user.license_expires_at) : null;

    if (license !== 'free' && expiresAt && expiresAt < new Date()) {
        await sb.from('users').update({ license: 'free', license_expires_at: null }).eq('id', user.id);
        license = 'free';
        expiresAt = null;
    }

    let licenseText = 'Лицензия: ' + (licenseNames[license] || 'Free');
    if (license !== 'free' && expiresAt) {
        licenseText += ' (до ' + expiresAt.toLocaleDateString('ru-RU') + ')';
    }
    document.getElementById('licenseBox').textContent = licenseText;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        deleteCookie('rpfa_email');
        window.location.href = 'index.html';
    });
});
