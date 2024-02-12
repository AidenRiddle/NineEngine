export class BitMask {
    static match(mask, flag) {
        return flag == (mask & flag);
    }

    static add(mask, flag) {
        return mask | flag;
    }

    static remove(mask, flag) {
        return mask - (mask & flag);
    }
    
    static debug(mask, flag) {
        return mask.toString(2) + " | "+ flag.toString(2);
    }
}