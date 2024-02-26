export class ScriptUtil {
    static logDev(...msgs) { System.log(System.dev_console_message_prefix, ...msgs); }
    static logDebug(...msgs) { System.log(System.debug_message_prefix, ...msgs); }

    static readByte(memory, addr) { return memory.readFloat(addr); }
}