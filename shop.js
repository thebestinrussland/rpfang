document.addEventListener('DOMContentLoaded', async () => {
    const email = getCookie('rpfa_email');
    if (!email) {
        window.location.href = 'index.html';
        return;
    }

    let currentUser = null;

    async function loadUser() {
        const { data: user } = await sb.from('users').select('*').eq('email', email).maybeSingle();
        currentUser = user;
        markCurrentPlan();
    }

    function markCurrentPlan() {
        document.querySelectorAll('.plan-card').forEach(card => {
            const isCurrent = currentUser && card.dataset.license === currentUser.license;
            card.classList.toggle('current', !!isCurrent);
            card.querySelector('.plan-status').textContent = isCurrent ? 'Текущий план' : '';
        });
    }

    await loadUser();

    document.getElementById('applyPromoBtn').addEventListener('click', async () => {
        const input = document.getElementById('promoInput');
        const messageEl = document.getElementById('promoMessage');
        const code = input.value.trim().toUpperCase();

        if (!code) {
            messageEl.textContent = 'Введи промокод';
            return;
        }

        const { data: promo, error } = await sb
            .from('promo_codes')
            .select('*')
            .eq('code', code)
            .maybeSingle();

        if (error) {
            messageEl.textContent = 'Ошибка: ' + error.message;
            return;
        }
        if (!promo) {
            messageEl.textContent = 'Такой промокод не найден';
            return;
        }
        if (promo.is_used) {
            messageEl.textContent = 'Этот промокод уже использован';
            return;
        }

        const expiresAt = new Date(Date.now() + promo.duration_days * 24 * 60 * 60 * 1000).toISOString();

        const { error: updateUserError } = await sb
            .from('users')
            .update({
                license: promo.license,
                license_expires_at: promo.license === 'free' ? null : expiresAt
            })
            .eq('id', currentUser.id);

        if (updateUserError) {
            messageEl.textContent = 'Ошибка активации: ' + updateUserError.message;
            return;
        }

        await sb
            .from('promo_codes')
            .update({ is_used: true, used_by: currentUser.id, used_at: new Date().toISOString() })
            .eq('id', promo.id);

        messageEl.textContent = 'Активировано: ' + promo.license.toUpperCase() + ' на ' + promo.duration_days + ' дней!';
        input.value = '';
        setTimeout(() => window.location.reload(), 1500);
    });
});
