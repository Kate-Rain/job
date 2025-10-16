package com.recruit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.recruit.model.InterviewDO;
import com.recruit.model.result.InterviewResultDO;
import com.recruit.vo.PageResponseVO;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author kate

 * 


 */
public interface InterviewService extends IService<InterviewDO> {
    PageResponseVO<InterviewResultDO> getByHrId(Integer count, Integer page, Integer hrID);

    PageResponseVO<InterviewResultDO> getByUserId(Integer count, Integer page, Integer userId);
}
