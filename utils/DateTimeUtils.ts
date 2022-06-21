export class DateTimeUtils {
    public static convertNumberToTime(number: number) {
        var minutes = Math.floor(number / 60);
        var seconds = "0" + (number - minutes * 60);
        return minutes.toString().slice(-2) + ":" + seconds.slice(-2);
    }
}