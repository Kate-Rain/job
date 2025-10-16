package com.recruit.mapper;

import com.recruit.model.NotifyDO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author kate

 * 


 */
public interface NotifyMapper extends BaseMapper<NotifyDO> {

    boolean update(String userName);
}
