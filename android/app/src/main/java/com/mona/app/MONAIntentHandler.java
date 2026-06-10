// MONA - OS Integration
package com.mona.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// MONA - OS Integration
public final class MONAIntentHandler {
    public static final String ACTION_OPEN = "com.mona.app.action.OPEN";
    public static final String ACTION_VIEW_SUMMARY = "com.mona.app.action.VIEW_SUMMARY";
    public static final String ACTION_VIEW_DAILY_SPEND = "com.mona.app.action.VIEW_DAILY_SPEND";
    public static final String ACTION_REGISTER_EXPENSE = "com.mona.app.action.REGISTER_EXPENSE";
    public static final String ACTION_ACTIVATE_VOICE = "com.mona.app.action.ACTIVATE_VOICE";
    public static final String ACTION_VOICE_COMMAND = "com.mona.app.action.VOICE_COMMAND";

    private static final String EXTRA_ACTION = "monaAction";
    private static final String EXTRA_AMOUNT = "amount";
    private static final String EXTRA_CATEGORY = "category";
    private static final String EXTRA_DESCRIPTION = "description";
    private static final String EXTRA_VOICE_TEXT = "voiceText";

    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)");

    private MONAIntentHandler() {
    }

    // MONA - OS Integration
    public static MONACommand fromIntent(Intent intent) {
        if (intent == null) return MONACommand.open();

        String voiceText = readExtra(intent, EXTRA_VOICE_TEXT);
        if (!TextUtils.isEmpty(voiceText)) return fromVoiceText(voiceText);

        Uri data = intent.getData();
        if (data != null) {
            MONACommand command = fromUri(data);
            if (command != null) return command;
        }

        String action = intent.getAction();
        String explicitAction = readExtra(intent, EXTRA_ACTION);
        if (!TextUtils.isEmpty(explicitAction)) {
            MONACommand command = fromActionName(explicitAction, intent);
            if (command != null) return command;
        }

        String feature = firstNonEmpty(readExtra(intent, "feature"), readExtra(intent, "featureParam"));
        if (!TextUtils.isEmpty(feature)) return fromFeature(feature);

        if (ACTION_REGISTER_EXPENSE.equals(action)) return recordExpense(intent);
        if (ACTION_VIEW_SUMMARY.equals(action)) return MONACommand.viewSummary();
        if (ACTION_VIEW_DAILY_SPEND.equals(action)) return MONACommand.viewDailySpend();
        if (ACTION_OPEN.equals(action) || Intent.ACTION_MAIN.equals(action)) return MONACommand.open();
        return MONACommand.open();
    }

    // MONA - OS Integration
    public static MONACommand fromVoiceText(String voiceText) {
        String original = voiceText == null ? "" : voiceText.trim();
        String normalized = normalize(original);

        if (isDailySpendQuery(normalized)) {
            return MONACommand.viewDailySpend();
        }

        if (containsAny(normalized, "resumen", "balance", "principal", "inicio", "dashboard")) {
            return MONACommand.viewSummary();
        }

        if (containsAny(normalized, "gasto", "gaste", "movimiento", "transaccion", "registrar", "registra", "agrega", "agregar", "anota", "anote", "ingresa", "ingresar", "puse", "poner", "paga", "pague")) {
            String amount = extractAmount(normalized);
            String category = extractKnownCategory(normalized);
            if (TextUtils.isEmpty(category)) {
                String cleanedText = normalized;
                if (!TextUtils.isEmpty(amount)) {
                    cleanedText = cleanedText.replace(amount, "");
                }
                cleanedText = cleanedText
                    .replaceAll("\\b(?:pesos|peso|dolares|dolar|dólares|dólar|euros|euro|rd|usd|cur)\\b", "")
                    .replaceAll("\\s+", " ").trim();
                category = extractCategory(cleanedText);
            }
            return MONACommand.recordExpense(amount, category, original);
        }

        return MONACommand.open();
    }

    // MONA - OS Integration
    public static Intent createLaunchIntent(Context context, MONACommand command) {
        Intent launch = new Intent(context, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launch.setAction(toAndroidAction(command.action));
        if (!TextUtils.isEmpty(command.amount)) launch.putExtra(EXTRA_AMOUNT, command.amount);
        if (!TextUtils.isEmpty(command.category)) launch.putExtra(EXTRA_CATEGORY, command.category);
        if (!TextUtils.isEmpty(command.description)) launch.putExtra(EXTRA_DESCRIPTION, command.description);
        return launch;
    }

    // MONA - OS Integration
    public static String toWebUrl(String baseUrl, MONACommand command) {
        MONACommand safeCommand = command == null ? MONACommand.open() : command;
        Uri.Builder builder = Uri.parse(baseUrl).buildUpon()
            .appendQueryParameter(EXTRA_ACTION, safeCommand.action)
            .appendQueryParameter("monaCommandId", String.valueOf(System.currentTimeMillis()));

        if (!TextUtils.isEmpty(safeCommand.amount)) builder.appendQueryParameter("monaAmount", safeCommand.amount);
        if (!TextUtils.isEmpty(safeCommand.category)) builder.appendQueryParameter("monaCategory", safeCommand.category);
        if (!TextUtils.isEmpty(safeCommand.description)) {
            builder.appendQueryParameter("monaDescription", safeCommand.description);
        }
        if (!TextUtils.isEmpty(safeCommand.filter)) {
            builder.appendQueryParameter("monaFilter", safeCommand.filter);
        }

        return builder.build().toString() + safeCommand.hash;
    }

    // MONA - OS Integration
    private static MONACommand fromUri(Uri uri) {
        String host = normalize(uri.getHost());
        String path = normalize(uri.getPath());
        String action = firstNonEmpty(uri.getQueryParameter(EXTRA_ACTION), host, path);

        if (containsAny(action, "summary", "resumen", "overview")) return MONACommand.viewSummary();
        if (isDailySpendAction(action)) return MONACommand.viewDailySpend();
        if (containsAny(action, "expense", "gasto", "transaction", "movimiento")) {
            return MONACommand.recordExpense(
                uri.getQueryParameter("amount"),
                uri.getQueryParameter("category"),
                uri.getQueryParameter("description")
            );
        }
        if (containsAny(action, "open", "abrir", "mona")) return MONACommand.open();
        return null;
    }

    // MONA - OS Integration
    private static MONACommand fromActionName(String actionName, Intent intent) {
        String normalized = normalize(actionName);
        if (isDailySpendAction(normalized)) return MONACommand.viewDailySpend();
        if (containsAny(normalized, "summary", "resumen")) return MONACommand.viewSummary();
        if (containsAny(normalized, "expense", "gasto", "transaction", "movimiento")) return recordExpense(intent);
        if (containsAny(normalized, "open", "abrir")) return MONACommand.open();
        return null;
    }

    // MONA - OS Integration
    private static MONACommand fromFeature(String feature) {
        String normalized = normalize(feature);
        if (isDailySpendAction(normalized)) return MONACommand.viewDailySpend();
        if (containsAny(normalized, "summary", "resumen", "overview")) return MONACommand.viewSummary();
        if (containsAny(normalized, "expense", "gasto", "transaction", "movimiento")) {
            return MONACommand.recordExpense("", "", "");
        }
        return MONACommand.open();
    }

    // MONA - OS Integration
    private static MONACommand recordExpense(Intent intent) {
        String amount = firstNonEmpty(readExtra(intent, EXTRA_AMOUNT), readExtra(intent, "monaAmount"));
        String category = firstNonEmpty(readExtra(intent, EXTRA_CATEGORY), readExtra(intent, "monaCategory"));
        if (!TextUtils.isEmpty(category)) {
            String known = extractKnownCategory(normalize(category));
            if (!TextUtils.isEmpty(known)) {
                category = known;
            } else {
                category = toTitleCase(category);
            }
        }
        String description = firstNonEmpty(
            readExtra(intent, EXTRA_DESCRIPTION),
            readExtra(intent, "monaDescription"),
            readExtra(intent, "name")
        );
        return MONACommand.recordExpense(amount, category, description);
    }

    // MONA - OS Integration
    private static String readExtra(Intent intent, String key) {
        Bundle extras = intent.getExtras();
        if (extras == null || !extras.containsKey(key)) return "";
        Object value = extras.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    // MONA - OS Integration
    private static String extractAmount(String text) {
        Matcher matcher = AMOUNT_PATTERN.matcher(text);
        return matcher.find() ? matcher.group(1).replace(',', '.') : "";
    }

    // MONA - OS Integration
    private static String extractKnownCategory(String text) {
        if (text.contains("comida") || text.contains("almuerzo") || text.contains("cena") || text.contains("desayuno") || text.contains("cafe") || text.contains("restaurante") || text.contains("delivery") || text.contains("antojo")) return "Comida";
        if (text.contains("transporte") || text.contains("taxi") || text.contains("uber") || text.contains("pasaje") || text.contains("guagua") || text.contains("metro") || text.contains("gasolina") || text.contains("combustible") || text.contains("peaje") || text.contains("carro") || text.contains("mototaxi")) {
            return "Transporte";
        }
        if (text.contains("entretenimiento") || text.contains("cine") || text.contains("salida") || text.contains("fiesta") || text.contains("suscripcion") || text.contains("netflix") || text.contains("spotify") || text.contains("juego") || text.contains("juegos") || text.contains("bar") || text.contains("cerveza") || text.contains("discoteca")) return "Entretenimiento";
        if (text.contains("salud") || text.contains("medicina") || text.contains("farmacia") || text.contains("doctor") || text.contains("dentista") || text.contains("consulta") || text.contains("clinica") || text.contains("hospital") || text.contains("remedio")) return "Salud";
        if (text.contains("compra") || text.contains("compras") || text.contains("colmado") || text.contains("super") || text.contains("supermercado") || text.contains("tienda") || text.contains("ropa") || text.contains("zapatos") || text.contains("mall")) return "Compras";
        if (text.contains("servicio") || text.contains("servicios") || text.contains("luz") || text.contains("agua") || text.contains("internet") || text.contains("telefono") || text.contains("cable") || text.contains("alquiler") || text.contains("renta") || text.contains("gas")) return "Servicios";
        if (text.contains("hormiga") || text.contains("snack") || text.contains("agua") || text.contains("botella") || text.contains("propina") || text.contains("regalo") || text.contains("donacion")) return "Otros Gastos";
        return "";
    }

    // MONA - OS Integration
    private static boolean isDailySpendQuery(String normalized) {
        if (!normalized.contains("hoy")) return false;
        return containsAny(
            normalized,
            "cuanto",
            "total",
            "gastado",
            "gastos de hoy",
            "gasto de hoy"
        );
    }

    // MONA - OS Integration
    private static boolean isDailySpendAction(String normalized) {
        return containsAny(
            normalized,
            "viewdailyspend",
            "dailyspend",
            "daily",
            "day",
            "gastos de hoy",
            "gasto de hoy",
            "gastoshoy",
            "gastodehoy"
        );
    }

    // MONA - OS Integration
    private static String extractCategory(String text) {
        Matcher matcher = Pattern.compile("\\b(?:en|de|para|por)\\s+([a-z0-9\\s]+)$").matcher(text);
        if (!matcher.find()) return "";
        String category = matcher.group(1).replaceAll("\\d+(?:[\\.,]\\d+)?", "").trim();
        if (TextUtils.isEmpty(category)) return "";
        return toTitleCase(category);
    }

    // MONA - OS Integration
    private static String normalize(String value) {
        String text = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        String decomposed = Normalizer.normalize(text, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }

    // MONA - OS Integration
    private static String toTitleCase(String value) {
        String[] parts = value.split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (TextUtils.isEmpty(part)) continue;
            if (builder.length() > 0) builder.append(' ');
            builder.append(part.substring(0, 1).toUpperCase(Locale.ROOT));
            if (part.length() > 1) builder.append(part.substring(1));
        }
        return builder.toString();
    }

    // MONA - OS Integration
    private static boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) return true;
        }
        return false;
    }

    // MONA - OS Integration
    private static String firstNonEmpty(String... values) {
        for (String value : values) {
            if (!TextUtils.isEmpty(value)) return value;
        }
        return "";
    }

    // MONA - OS Integration
    private static String toAndroidAction(String webAction) {
        if ("recordExpense".equals(webAction) || "recordTransaction".equals(webAction)) return ACTION_REGISTER_EXPENSE;
        if ("viewDailySpend".equals(webAction)) return ACTION_VIEW_DAILY_SPEND;
        if ("viewSummary".equals(webAction)) return ACTION_VIEW_SUMMARY;
        return ACTION_OPEN;
    }

    // MONA - OS Integration
    public static final class MONACommand {
        public final String action;
        public final String amount;
        public final String category;
        public final String description;
        public final String hash;
        public final String filter;

        private MONACommand(String action, String amount, String category, String description, String hash, String filter) {
            this.action = action;
            this.amount = amount == null ? "" : amount;
            this.category = category == null ? "" : category;
            this.description = description == null ? "" : description;
            this.hash = hash;
            this.filter = filter == null ? "" : filter;
        }

        public static MONACommand open() {
            return new MONACommand("open", "", "", "", "#/overview", "");
        }

        public static MONACommand viewSummary() {
            return new MONACommand("viewSummary", "", "", "", "#/overview", "");
        }

        public static MONACommand viewDailySpend() {
            return new MONACommand("viewDailySpend", "", "", "", "#/transactions", "day");
        }

        public static MONACommand recordExpense(String amount, String category, String description) {
            return new MONACommand("recordExpense", amount, category, description, "#/transactions", "");
        }
    }
}
