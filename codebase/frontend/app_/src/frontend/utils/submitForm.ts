export const submitForm = <T = any>(action: string, name: string, value: T): void => {
    const form = document.createElement('form');
    form.action = action;
    form.method = 'POST';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = JSON.stringify(value);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
};
