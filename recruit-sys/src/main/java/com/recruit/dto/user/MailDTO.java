package com.recruit.dto.user;

import java.io.Serializable;

/**
 * @Param eval
 */
public class MailDTO implements Serializable {
    public String recvMail;  // 接收者
    public String subject;   // 标题
    public String content;   // 内容
}
