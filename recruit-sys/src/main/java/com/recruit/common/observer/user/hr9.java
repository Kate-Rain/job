package com.recruit.common.observer.user;

import com.recruit.common.observer.Observer;
import com.recruit.common.util.SingleUtil;
import lombok.Data;

/**
* @author kate

*
* 观察者子类——hr9用户
*/
@Data
public class hr9 extends Observer {

    /**
    * 观察者名字
    */
    private String name = "hr9";

    @Override
    public void update() {
        // 根据message和name存一条记录到全局map中：messageMap
        SingleUtil.messageMap.put(name, message);
    }
}
