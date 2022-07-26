const mongoose = require('mongoose');
const Discord = require("discord.js");
const Sanction = require('../../models/sanction');
const moment = require('moment');
const momentDurationFormatSetup = require("moment-duration-format");

exports.run = (client, message, args) =>{
    if (args.length > 0) {
        let target = message.guild.members.get(args[0].replace(/[\\<>@#&!]/g, ""));
        args.shift();
        if(target) {
            console.log(target.highestRole.calculatedPosition+" < "+ message.member.highestRole.calculatedPosition);
            if(target.highestRole.calculatedPosition < message.member.highestRole.calculatedPosition){
                let reason = (args.length > 0)?args.join(" "):undefined;
                exports.mute(client, message, target, message.member, reason);
            }else{
                message.channel.send(":x: Vous n'avez pas la permisson suiffisante de mute ce membre").then((value) => {
                    message.delete(10000);
                    value.delete(10000);
                });
            }
        }else{
            message.channel.send(":x: Le membre est introuvable").then((value) => {
                message.delete(10000);
                value.delete(10000);
            });
        }
    } else {
        let help = new Discord.RichEmbed()
            .setColor("#FF0000")
            .setTitle('❌')
            .setDescription(client.config.prefix+'mute [mention] (raison)');
        message.channel.send(help).then((value) => {
            message.delete(10000);
            value.delete(10000);
        });
    }
};

exports.mute = function mute(client, message, target, modo, reason){
    let roleMuted = target.guild.roles.find((role) => role.name === "Muted");
    if(roleMuted === undefined){
        message.channel.send(":x: Le role `Muted` est introuvable sur le serveur").then((value) => {
            message.delete(10000);
            value.delete(10000);
        });
        return;
    }
    Sanction.findOne({
        userID: target.user.id,
        guildID: message.guild.id,
        type: "mute",
        finish: false
    }, function(err, doc) {
        if(doc) return message.channel.send(":x: Le membre est déjà mute");
        const sanction = new Sanction({
            userID: target.user.id,
            moderatorID: modo.user.id,
            guildID: message.guild.id,
            type: "mute",
            date: new Date(),
            duration: -1,
            reason: (reason)?reason:null,
            finish: false
        });
        sanction.save().then();
        target.addRole(roleMuted, reason).then(() => {
            message.delete();
            message.channel.send(`:hammer: ${target} a été mute par ${message.member}` + ((reason)?` pour : `+"`"+reason+"`":''));
            let log = new Discord.RichEmbed()
                .setColor("#ff810c")
                .setAuthor("MUTE | "+target.user.username+"#"+target.user.discriminator, target.user.avatarURL);
            if(reason) log.addField("Raison", (reason)?reason:"Aucune");
            log.addField("Modérateur", modo.displayName, true)
                .addField("Durée", "Permanent", true)
                .setTimestamp(new Date());
            message.guild.channels.get(client.modoLogID).send(log);
            let embed = new Discord.RichEmbed()
                .setColor("#ff810c")
                .setTitle(":hammer:  **Vous avez été mute**");
            if(reason) embed.addField("Raison", (reason)?reason:"Aucune");
            embed.addField("Serveur", message.guild.name, true)
                .addField("Modérateur", modo.displayName, true)
                .addField("Durée", "Permanent", true)
                .setTimestamp(new Date());
            target.user.send(embed).catch((error) => {});
        }).catch(() => {
            message.channel.send(":x: Vous n'avez pas la permisson suiffisante de mute ce membre").then((value) => {
                message.delete(10000);
                value.delete(10000);
            });
        });
    });
};


exports.info = {
    aliases: [],
    description: "Mute un membre",
    usage: "[mention] (raison)",
    category: "Modération",
    permissions: "MANAGE_NICKNAMES",
    showHelp: true
};
