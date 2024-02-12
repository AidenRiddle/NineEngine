
function fib(depth) {
    let a = 0, b = 1, c, i;
    if (depth == 0)
        return a;
    for (i = 2; i <= depth; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    return b;
}